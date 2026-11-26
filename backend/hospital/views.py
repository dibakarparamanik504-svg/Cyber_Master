import logging
from secrets import token_urlsafe

from django.db.models import Q
from google.genai.errors import APIError
from google.genai import types
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ai_assistant.services import (
    GeminiNotConfiguredError,
    build_system_instruction,
    generate_answer,
)

from .models import Department, Facility, Feedback, HospitalProfile, Notice, Specialist


logger = logging.getLogger(__name__)
NOTICE_LANGUAGES = {
    'Bengali': 'Bengali',
    'English': 'English',
    'Hindi': 'Hindi',
    'Odia': 'Odia',
    'Nepali': 'Nepali',
    'Tamil': 'Tamil',
    'Telugu': 'Telugu',
}
DEPARTMENT_LANGUAGES = {
    'English': 'en-IN',
    'Bengali': 'bn-IN',
    'Hindi': 'hi-IN',
    'Odia': 'or-IN',
    'Tamil': 'ta-IN',
    'Telugu': 'te-IN',
    'Nepali': 'ne',
}


def owner_token(request):
    token = request.session.get('hospital_owner')
    if not token:
        token = token_urlsafe(32)
        request.session['hospital_owner'] = token
    return token


def serialize_profile(profile):
    if profile is None:
        return {
            'name': 'PULSELINE Hospital',
            'address': '',
            'phone': '',
            'email': '',
            'contactHours': '',
            'introduction': '',
            'history': '',
            'mission': '',
            'vision': '',
            'totalStaff': None,
            'availableBeds': None,
            'infrastructureCount': None,
            'emergencySupport': '',
        }
    return {
        'name': profile.name,
        'address': profile.address,
        'phone': profile.phone,
        'email': profile.email,
        'contactHours': profile.contact_hours,
        'introduction': profile.introduction,
        'history': profile.history,
        'mission': profile.mission,
        'vision': profile.vision,
        'totalStaff': profile.total_staff,
        'availableBeds': profile.available_beds,
        'infrastructureCount': profile.infrastructure_count,
        'emergencySupport': profile.emergency_support,
    }


def serialize_department(department):
    return {
        'id': department.pk,
        'name': department.name,
        'category': department.category,
        'icon': department.icon,
        'tagline': department.tagline,
        'description': department.description,
        'services': department.services,
        'facilities': department.facilities,
        'floor': department.floor,
        'hours': department.hours,
        'contact': department.contact,
        'phoneExtension': department.phone_extension,
        'officialEmail': department.official_email,
        'color': department.color,
        'isVerified': department.is_verified,
    }


def serialize_facility(facility):
    return {
        'name': facility.name,
        'icon': facility.icon,
        'description': facility.description,
        'status': facility.status,
        'details': facility.details,
        'isVerified': facility.is_verified,
    }


def ai_error_response(error):
    if isinstance(error, GeminiNotConfiguredError):
        return Response({'detail': str(error)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    if isinstance(error, APIError) and error.code in (429, 503):
        logger.warning('Gemini is temporarily unavailable (status %s).', error.code)
        return Response(
            {'detail': 'Gemini is temporarily unavailable. Please try again shortly.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    logger.exception('Hospital AI request failed.')
    return Response(
        {'detail': 'The AI service could not complete this request. Please try again.'},
        status=status.HTTP_502_BAD_GATEWAY,
    )


@api_view(['GET'])
def hospital_profile(request):
    profile = HospitalProfile.objects.first()
    return Response(serialize_profile(profile))


@api_view(['GET'])
def notices(request):
    token = request.session.get('hospital_owner', '')
    records = Notice.objects.filter(is_published=True)
    if token:
        records = (records | Notice.objects.filter(owner_token=token)).distinct()
    return Response([
        {
            'id': notice.pk,
            'title': notice.title,
            'body': notice.body,
            'date': notice.created_at,
            'isPublished': notice.is_published,
        }
        for notice in records.order_by('-created_at')
    ])


@api_view(['POST'])
def notice_drafts(request):
    title = str(request.data.get('title', '')).strip()
    body = str(request.data.get('body', '')).strip()
    if not body:
        return Response({'body': 'Notice text is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if len(title) > 160 or len(body) > 10000:
        return Response(
            {'detail': 'Notice title or body exceeds the allowed length.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    notice = Notice.objects.create(
        title=title or body[:70],
        body=body,
        owner_token=owner_token(request),
    )
    return Response(
        {
            'id': notice.pk,
            'title': notice.title,
            'body': notice.body,
            'date': notice.created_at,
            'isPublished': False,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
def submit_feedback(request):
    try:
        rating = int(request.data.get('rating', 0))
    except (TypeError, ValueError):
        return Response({'rating': 'Rating must be between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)
    message = str(request.data.get('message', '')).strip()
    if rating not in range(1, 6):
        return Response({'rating': 'Rating must be between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)
    if len(message) > 2000:
        return Response({'message': 'Feedback cannot exceed 2000 characters.'}, status=status.HTTP_400_BAD_REQUEST)
    category = str(request.data.get('category', 'General')).strip()[:80] or 'General'
    department = None
    department_name = str(request.data.get('department', '')).strip()
    if department_name:
        department = Department.objects.filter(name=department_name, is_active=True).first()
        if department is None:
            return Response({'department': 'Department not found.'}, status=status.HTTP_400_BAD_REQUEST)
    entry = Feedback.objects.create(
        owner_token=owner_token(request),
        category=category,
        department=department,
        rating=rating,
        message=message,
    )
    return Response(
        {'id': entry.pk, 'rating': entry.rating, 'createdAt': entry.created_at},
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
def departments(request):
    records = Department.objects.filter(is_active=True)
    category = request.query_params.get('category')
    if category and category != 'All':
        records = records.filter(category=category)
    search = request.query_params.get('search', '').strip()
    if search:
        records = records.filter(
            Q(name__icontains=search)
            | Q(tagline__icontains=search)
            | Q(description__icontains=search)
        )
    return Response([serialize_department(item) for item in records])


@api_view(['GET'])
def specialists(request):
    records = Specialist.objects.filter(is_active=True, is_verified=True)
    department = request.query_params.get('department')
    if department:
        records = records.filter(department__name=department)
    return Response([
        {
            'name': item.name,
            'department': item.department.name,
            'qualification': item.qualification,
            'experience': (
                f'{item.experience_years} years'
                if item.experience_years is not None
                else 'Not provided'
            ),
            'languages': ', '.join(item.languages),
        }
        for item in records
    ])


@api_view(['GET'])
def facilities(request):
    records = Facility.objects.filter(is_active=True)
    return Response([serialize_facility(item) for item in records])


@api_view(['POST'])
def department_discovery(request):
    question = str(request.data.get('text', '')).strip()
    language = request.data.get('language', 'English')
    if not question or len(question) > 2000:
        return Response(
            {'text': 'Enter a request of 1 to 2000 characters.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if language not in DEPARTMENT_LANGUAGES:
        return Response({'language': 'Select a supported language.'}, status=status.HTTP_400_BAD_REQUEST)

    directory = list(Department.objects.filter(is_active=True).values('name', 'category', 'services'))
    if not directory:
        return Response(
            {'detail': 'The hospital department directory has not been configured.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    system_instruction = build_system_instruction(DEPARTMENT_LANGUAGES[language], True)
    prompt = (
        f'{system_instruction} The user requests general hospital service information. '
        f'Choose at most one matching department from this exact directory: {directory}. '
        'Do not diagnose symptoms or recommend treatment. If no service clearly matches, '
        'say so and suggest contacting the hospital information desk. Reply in the '
        f'selected language ({language}) with the department name and a brief reason.'
    )
    try:
        answer = generate_answer(
            DEPARTMENT_LANGUAGES[language],
            True,
            [types.Content(role='user', parts=[types.Part.from_text(text=f'{prompt}\n\nRequest: {question}')])],
        )
    except Exception as error:
        return ai_error_response(error)
    return Response({'result': answer, 'language': language})


def notice_ai(request, action):
    text = str(request.data.get('text', '')).strip()
    language = request.data.get('language', 'English')
    if not text or len(text) > 10000:
        return Response(
            {'text': 'Enter text of 1 to 10000 characters.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if language not in NOTICE_LANGUAGES:
        return Response({'language': 'Select a supported language.'}, status=status.HTTP_400_BAD_REQUEST)
    if action == 'translate':
        prompt = (
            f'Translate this hospital notice into {NOTICE_LANGUAGES[language]}. '
            'Preserve dates, times, names, phone numbers, and meaning. Do not add '
            'claims or extra instructions. Return only the translation:\n\n'
        )
    else:
        prompt = (
            'Summarize this hospital notice accurately. Keep all dates, times, '
            'eligibility requirements, and important actions. Do not invent details. '
            f'Write the summary in {NOTICE_LANGUAGES[language]}:\n\n'
        )
    try:
        result = generate_answer(
            language=DEPARTMENT_LANGUAGES.get(language, 'en-IN'),
            simplified_mode=True,
            contents=[
                types.Content(
                    role='user',
                    parts=[types.Part.from_text(text=prompt + text)],
                )
            ],
        )
    except Exception as error:
        return ai_error_response(error)
    return Response({'result': result, 'language': language})


@api_view(['POST'])
def notice_summary(request):
    return notice_ai(request, 'summary')


@api_view(['POST'])
def notice_translate(request):
    return notice_ai(request, 'translate')
