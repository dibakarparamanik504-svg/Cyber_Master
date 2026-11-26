from datetime import timedelta
import logging
from secrets import token_urlsafe
from uuid import UUID

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from google.genai.errors import APIError
from google.genai import types

from .models import Conversation, Message
from .services import GeminiNotConfiguredError, LANGUAGES, generate_answer


logger = logging.getLogger(__name__)
MAX_MESSAGE_LENGTH = 4000
MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_FILE_TYPES = {
    'image/jpeg': 'image',
    'image/png': 'image',
    'image/webp': 'image',
    'application/pdf': 'document',
    'text/plain': 'text',
}
HISTORY_MESSAGE_LIMIT = 12
CONVERSATION_RETENTION = timedelta(hours=24)


def get_owner_token(request):
    owner_token = request.session.get('ai_assistant_owner')
    if not owner_token:
        owner_token = token_urlsafe(32)
        request.session['ai_assistant_owner'] = owner_token
    return owner_token


def build_file_part(upload):
    if upload.size > MAX_FILE_SIZE:
        return None, 'File size must be less than 10 MB.'

    content_type = upload.content_type
    expected_type = ALLOWED_FILE_TYPES.get(content_type)
    if not expected_type:
        return None, 'Only JPG, PNG, WEBP, PDF, and TXT files are supported.'

    data = upload.read()
    if expected_type == 'text':
        try:
            text = data.decode('utf-8')
        except UnicodeDecodeError:
            return None, 'Text attachments must use UTF-8 encoding.'
        return f'\n\nAttached text file ({upload.name}):\n{text}', None

    return types.Part.from_bytes(data=data, mime_type=content_type), None


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def chat(request):
    message_text = request.data.get('message', '').strip()
    language = request.data.get('language', 'en-IN')
    simplified_value = request.data.get('simplified_mode', 'false')
    upload = request.FILES.get('file')

    if not message_text and not upload:
        return Response(
            {'message': 'Enter a message or attach a supported file.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if len(message_text) > MAX_MESSAGE_LENGTH:
        return Response(
            {'message': f'Message cannot exceed {MAX_MESSAGE_LENGTH} characters.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if language not in LANGUAGES:
        return Response(
            {'language': 'Select one of the supported assistant languages.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not settings.GEMINI_API_KEY:
        return Response(
            {'detail': 'Gemini is not configured. Set GEMINI_API_KEY in backend/.env.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    if simplified_value not in ('true', 'false', True, False):
        return Response(
            {'simplified_mode': 'Expected true or false.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    simplified_mode = simplified_value in ('true', True)
    file_part = None
    if upload:
        file_part, file_error = build_file_part(upload)
        if file_error:
            return Response({'file': file_error}, status=status.HTTP_400_BAD_REQUEST)

    owner_token = get_owner_token(request)
    Conversation.objects.filter(
        updated_at__lt=timezone.now() - CONVERSATION_RETENTION,
    ).delete()
    raw_conversation_id = request.data.get('conversation_id')
    if raw_conversation_id:
        try:
            conversation_id = UUID(str(raw_conversation_id))
        except (ValueError, TypeError, AttributeError):
            return Response(
                {'conversation_id': 'Invalid conversation ID.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        conversation = Conversation.objects.filter(
            id=conversation_id,
            owner_token=owner_token,
        ).first()
        if conversation is None:
            return Response(
                {'detail': 'Conversation not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
    else:
        conversation = None

    user_text = message_text or f'Please analyze the attached file: {upload.name}'
    current_parts = [types.Part.from_text(text=user_text)]
    if file_part:
        if isinstance(file_part, str):
            current_parts[0] = types.Part.from_text(text=user_text + file_part)
        else:
            current_parts.append(file_part)

    previous_messages = (
        list(
            conversation.messages.order_by('-created_at', '-pk')[
                :HISTORY_MESSAGE_LIMIT
            ]
        )
        if conversation
        else []
    )
    previous_messages.reverse()
    contents = [
        types.Content(
            role=stored_message.role,
            parts=[types.Part.from_text(text=stored_message.text)],
        )
        for stored_message in previous_messages
    ]
    contents.append(types.Content(role='user', parts=current_parts))

    try:
        answer = generate_answer(language, simplified_mode, contents)
    except GeminiNotConfiguredError as error:
        return Response(
            {'detail': str(error)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except APIError as error:
        if error.code in (429, 503):
            logger.warning('Gemini is temporarily unavailable (status %s).', error.code)
            return Response(
                {'detail': 'Gemini is temporarily unavailable. Please try again shortly.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        logger.exception('Gemini returned an API error (status %s).', error.code)
        return Response(
            {'detail': 'The AI service could not complete this request. Please try again.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    except Exception:
        logger.exception('Gemini chat request failed.')
        return Response(
            {'detail': 'The AI service could not complete this request. Please try again.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    with transaction.atomic():
        if conversation is None:
            conversation = Conversation.objects.create(owner_token=owner_token)
        Message.objects.create(
            conversation=conversation,
            role='user',
            text=user_text[:MAX_MESSAGE_LENGTH],
        )
        Message.objects.create(
            conversation=conversation,
            role='model',
            text=answer[:MAX_MESSAGE_LENGTH],
        )
        conversation.save(update_fields=['updated_at'])

    return Response({
        'answer': answer,
        'source': 'Gemini · PULSELINE',
        'conversation_id': str(conversation.id),
        'sources': [],
    })
