from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError, transaction
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserProfile


User = get_user_model()


def serialize_user(user):
    profile = getattr(user, 'profile', None)
    name = (
        profile.full_name
        if profile
        else user.get_full_name().strip() or user.email or user.get_username()
    )
    return {
        'id': user.pk,
        'name': name,
        'email': user.email,
        'phone': profile.phone if profile else '',
        'dateJoined': user.date_joined.isoformat(),
    }


@ensure_csrf_cookie
@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def csrf_token(request):
    return Response({'csrfToken': get_token(request._request)})


@method_decorator(csrf_protect, name='dispatch')
class SignUpView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        name = request.data.get('name', '')
        email = request.data.get('email', '')
        phone = request.data.get('phone', '')
        password = request.data.get('password', '')
        password_confirmation = request.data.get('passwordConfirmation', '')

        if not all(isinstance(value, str) for value in (name, email, phone, password)):
            return Response(
                {'detail': 'Name, email, phone, and password must be text values.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        name = name.strip()
        email = email.strip().lower()
        phone = phone.strip()
        if not name or not email or not password:
            return Response(
                {'detail': 'Name, email, and password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(name) > 150:
            return Response(
                {'detail': 'Name must be 150 characters or fewer.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(email) > 150:
            return Response(
                {'detail': 'Email must be 150 characters or fewer.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(phone) > 30:
            return Response(
                {'detail': 'Phone number must be 30 characters or fewer.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if password != password_confirmation:
            return Response(
                {'detail': 'Passwords do not match.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_email(email)
        except ValidationError:
            return Response(
                {'detail': 'Enter a valid email address.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(email__iexact=email).exists():
            return Response(
                {'detail': 'An account with this email already exists.'},
                status=status.HTTP_409_CONFLICT,
            )

        candidate = User(username=email, email=email, first_name=name)
        try:
            validate_password(password, user=candidate)
        except ValidationError as error:
            return Response(
                {'detail': ' '.join(error.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    first_name=name,
                    password=password,
                )
                UserProfile.objects.create(
                    user=user,
                    full_name=name,
                    phone=phone,
                )
        except IntegrityError:
            return Response(
                {'detail': 'An account with this email already exists.'},
                status=status.HTTP_409_CONFLICT,
            )

        login(request._request, user)
        return Response(
            {
                'user': serialize_user(user),
                'csrfToken': get_token(request._request),
            },
            status=status.HTTP_201_CREATED,
        )


@method_decorator(csrf_protect, name='dispatch')
class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '')
        password = request.data.get('password', '')
        if not isinstance(email, str) or not isinstance(password, str):
            return Response(
                {'detail': 'Email and password must be text values.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = email.strip().lower()
        if not email or not password:
            return Response(
                {'detail': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(
            request=request._request,
            username=email,
            password=password,
        )
        if user is None:
            return Response(
                {'detail': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        login(request._request, user)
        return Response(
            {
                'user': serialize_user(user),
                'csrfToken': get_token(request._request),
            }
        )


@method_decorator(csrf_protect, name='dispatch')
class LogoutView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request._request)
        return Response({'detail': 'You have been signed out.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response({'user': serialize_user(request.user)})
