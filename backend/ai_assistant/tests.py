from unittest.mock import patch

from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase
from google.genai.errors import APIError

from .models import Conversation
from .services import LANGUAGES, generate_answer


@override_settings(ALLOWED_HOSTS=['testserver'], GEMINI_API_KEY='test-key')
class AIAssistantApiTests(APITestCase):
    def setUp(self):
        self.url = reverse('ai-assistant-chat')
        self.payload = {
            'message': 'What should I bring to my appointment?',
            'language': 'en-IN',
            'simplified_mode': 'false',
        }

    @patch(
        'ai_assistant.views.retrieve_hospital_context',
        return_value=('Hospital: Example Hospital', ['Hospital profile']),
    )
    @patch('ai_assistant.views.generate_answer', return_value='Bring your ID.')
    def test_chat_returns_answer_and_hospital_sources(
        self,
        generate,
        retrieve_context,
    ):
        response = self.client.post(self.url, self.payload, format='multipart')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['answer'], 'Bring your ID.')
        self.assertEqual(response.data['source'], 'Gemini · PULSELINE')
        self.assertEqual(response.data['sources'], ['Hospital profile'])
        self.assertEqual(response.data['language'], 'en-IN')
        self.assertIn('conversation_id', response.data)
        self.assertEqual(Conversation.objects.count(), 1)
        self.assertEqual(Conversation.objects.get().messages.count(), 2)
        self.assertEqual(generate.call_args.args[0:2], ('en-IN', False))
        self.assertEqual(
            generate.call_args.kwargs['trusted_context'],
            'Hospital: Example Hospital',
        )
        retrieve_context.assert_called_once()

    @patch('ai_assistant.views.generate_answer', return_value='ଆପଣଙ୍କ ପରିଚୟପତ୍ର ଆଣନ୍ତୁ।')
    def test_selected_language_and_simple_mode_reach_gemini(self, generate):
        payload = {
            **self.payload,
            'language': 'or-IN',
            'simplified_mode': 'true',
        }

        response = self.client.post(self.url, payload, format='multipart')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(generate.call_args.args[0:2], ('or-IN', True))

    @patch('ai_assistant.views.generate_answer', return_value='Hello.')
    def test_all_languages_offered_by_the_ui_are_accepted(self, generate):
        for language in LANGUAGES:
            with self.subTest(language=language):
                response = self.client.post(
                    self.url,
                    {**self.payload, 'language': language},
                    format='multipart',
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.data['language'], language)

        self.assertEqual(generate.call_count, len(LANGUAGES))

    def test_unsupported_language_is_rejected(self):
        payload = {**self.payload, 'language': 'xx-XX'}

        response = self.client.post(self.url, payload, format='multipart')

        self.assertEqual(response.status_code, 400)
        self.assertIn('language', response.data)

    def test_conversation_cannot_be_accessed_from_another_session(self):
        with patch('ai_assistant.views.generate_answer', return_value='Response'):
            first_response = self.client.post(
                self.url,
                self.payload,
                format='multipart',
            )

        another_client = self.client_class()
        payload = {
            **self.payload,
            'conversation_id': first_response.data['conversation_id'],
        }
        response = another_client.post(self.url, payload, format='multipart')

        self.assertEqual(response.status_code, 404)

    @patch('ai_assistant.views.generate_answer', return_value='First answer.')
    def test_follow_up_receives_recent_conversation_context(self, generate):
        first_response = self.client.post(
            self.url,
            self.payload,
            format='multipart',
        )
        follow_up = {
            **self.payload,
            'message': 'Can you explain that?',
            'conversation_id': first_response.data['conversation_id'],
        }

        response = self.client.post(self.url, follow_up, format='multipart')

        self.assertEqual(response.status_code, 200)
        previous_contents = generate.call_args.args[2][:-1]
        self.assertEqual(len(previous_contents), 2)
        self.assertEqual(previous_contents[0].role, 'user')
        self.assertEqual(previous_contents[1].role, 'model')

    @override_settings(GEMINI_API_KEY='')
    def test_missing_gemini_key_returns_setup_error(self):
        response = self.client.post(self.url, self.payload, format='multipart')

        self.assertEqual(response.status_code, 503)
        self.assertIn('GEMINI_API_KEY', response.data['detail'])

    @patch(
        'ai_assistant.views.generate_answer',
        side_effect=APIError(503, {'error': {'message': 'temporary'}}),
    )
    def test_temporary_gemini_outage_returns_retryable_status(self, generate):
        response = self.client.post(self.url, self.payload, format='multipart')

        self.assertEqual(response.status_code, 503)
        self.assertIn('try again shortly', response.data['detail'])

    def test_unsupported_attachment_type_is_rejected(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        upload = SimpleUploadedFile(
            'script.exe',
            b'not supported',
            content_type='application/octet-stream',
        )

        response = self.client.post(
            self.url,
            {**self.payload, 'file': upload},
            format='multipart',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('file', response.data)

    @patch('ai_assistant.views.generate_answer', return_value='The image shows a form.')
    def test_image_attachment_is_sent_to_the_model(self, generate):
        from django.core.files.uploadedfile import SimpleUploadedFile

        upload = SimpleUploadedFile(
            'form.png',
            b'\x89PNG\r\n\x1a\nimage-data',
            content_type='image/png',
        )

        response = self.client.post(
            self.url,
            {**self.payload, 'file': upload},
            format='multipart',
        )

        self.assertEqual(response.status_code, 200)
        parts = generate.call_args.args[2][-1].parts
        self.assertEqual(len(parts), 2)


@override_settings(
    GEMINI_API_KEY='test-key',
    GEMINI_MODEL='gemini-3.8-flash',
    GEMINI_FALLBACK_MODEL='gemini-3.5-flash-lite',
)
class GeminiFallbackTests(APITestCase):
    @patch('ai_assistant.services.genai.Client')
    def test_primary_overload_uses_configured_fallback_model(self, client_factory):
        client = client_factory.return_value
        client.models.generate_content.side_effect = [
            APIError(503, {'error': {'message': 'temporarily unavailable'}}),
            type('Response', (), {'text': 'Fallback answer.'})(),
        ]

        answer = generate_answer('en-IN', False, [])

        self.assertEqual(answer, 'Fallback answer.')
        self.assertEqual(
            [
                call.kwargs['model']
                for call in client.models.generate_content.call_args_list
            ],
            ['gemini-3.8-flash', 'gemini-3.5-flash-lite'],
        )
        client.close.assert_called_once_with()
