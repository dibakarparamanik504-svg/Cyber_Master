from unittest.mock import patch

from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from .knowledge import retrieve_hospital_context
from .models import Department, Facility, Feedback, HospitalProfile, Notice, Specialist
from .views import DEPARTMENT_LANGUAGES, NOTICE_LANGUAGES


@override_settings(ALLOWED_HOSTS=['testserver'], GEMINI_API_KEY='test-key')
class HospitalApiTests(APITestCase):
    def setUp(self):
        self.department, _ = Department.objects.get_or_create(
            name='Cardiology',
            defaults={
                'category': 'Medicine',
                'description': 'Heart services',
                'services': ['ECG'],
            },
        )

    def test_public_profile_uses_safe_empty_defaults(self):
        response = self.client.get(reverse('hospital-profile'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], 'PULSELINE Hospital')
        self.assertIsNone(response.data['availableBeds'])

    def test_public_profile_returns_staff_managed_data(self):
        HospitalProfile.objects.create(name='Verified Hospital', available_beds=12)

        response = self.client.get(reverse('hospital-profile'))

        self.assertEqual(response.data['name'], 'Verified Hospital')
        self.assertEqual(response.data['availableBeds'], 12)

    def test_notice_drafts_are_private_and_not_published(self):
        create = self.client.post(
            reverse('notice-drafts'),
            {'title': 'Draft', 'body': 'Draft text'},
            format='json',
        )

        self.assertEqual(create.status_code, 201)
        self.assertFalse(create.data['isPublished'])
        self.assertEqual(len(self.client.get(reverse('hospital-notices')).data), 1)

        another_client = self.client_class()
        self.assertEqual(another_client.get(reverse('hospital-notices')).data, [])

    def test_public_notice_list_includes_only_published_official_notice(self):
        Notice.objects.create(title='Public', body='Published', is_published=True)
        Notice.objects.create(title='Private', body='Unpublished', owner_token='other')

        response = self.client.get(reverse('hospital-notices'))

        self.assertEqual([notice['title'] for notice in response.data], ['Public'])

    def test_ai_context_uses_only_verified_directory_and_published_notices(self):
        HospitalProfile.objects.create(
            name='Example Hospital',
            address='12 Main Street',
            phone='555-0100',
        )
        self.department.is_verified = True
        self.department.hours = 'Open weekdays'
        self.department.save()
        Department.objects.create(
            name='Unverified Service',
            category='Medicine',
            description='Not approved for public answers.',
        )
        Facility.objects.create(
            name='Imaging Center',
            description='Radiology imaging',
            is_verified=True,
        )
        Specialist.objects.create(
            department=self.department,
            name='Dr Example',
            qualification='MD',
            languages=['Bengali', 'English'],
            is_verified=True,
        )
        Notice.objects.create(
            title='Clinic Hours',
            body='The clinic opens at 9 AM.',
            is_published=True,
        )
        Notice.objects.create(
            title='Private Draft',
            body='This draft must not be sent to AI.',
            owner_token='other',
        )

        context, sources = retrieve_hospital_context('Cardiology clinic hours')

        self.assertIn('12 Main Street', context)
        self.assertIn('Cardiology', context)
        self.assertIn('Dr Example', context)
        self.assertIn('Clinic Hours', context)
        self.assertNotIn('Unverified Service', context)
        self.assertNotIn('Private Draft', context)
        self.assertIn('Department: Cardiology', sources)
        self.assertIn('Official notice: Clinic Hours', sources)

        _, localized_sources = retrieve_hospital_context('হৃদরোগ বিভাগের সময়')
        self.assertIn('Department: Cardiology', localized_sources)

    def test_feedback_is_validated_and_persisted(self):
        response = self.client.post(
            reverse('hospital-feedback'),
            {'rating': 4, 'category': 'Communication', 'message': 'Helpful staff'},
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Feedback.objects.get().message, 'Helpful staff')

    def test_invalid_feedback_rating_is_rejected(self):
        response = self.client.post(
            reverse('hospital-feedback'),
            {'rating': 9, 'message': 'Not valid'},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(Feedback.objects.exists())

    def test_department_directory_and_facilities_are_database_backed(self):
        departments_response = self.client.get(reverse('department-list'))
        facilities_response = self.client.get(reverse('facility-list'))

        self.assertEqual(departments_response.data[0]['name'], 'Cardiology')
        self.assertGreater(len(facilities_response.data), 0)
        self.assertFalse(facilities_response.data[0]['isVerified'])

    @patch('hospital.views.generate_answer', return_value='Cardiology: heart services.')
    def test_department_discovery_uses_gemini_and_selected_language(self, generate):
        response = self.client.post(
            reverse('department-discovery'),
            {'text': 'heart services', 'language': 'Bengali'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['result'], 'Cardiology: heart services.')
        self.assertEqual(generate.call_args.args[0:2], ('bn-IN', True))

    @patch('hospital.views.generate_answer', return_value='Short notice.')
    def test_notice_summary_calls_gemini(self, generate):
        response = self.client.post(
            reverse('notice-summary'),
            {'text': 'A long official notice.', 'language': 'English'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['result'], 'Short notice.')
        self.assertEqual(generate.call_count, 1)

    @patch('hospital.views.generate_answer', return_value='Translated notice.')
    def test_notice_translation_supports_all_assistant_languages(self, generate):
        for language, code in DEPARTMENT_LANGUAGES.items():
            with self.subTest(language=language):
                response = self.client.post(
                    reverse('notice-translate'),
                    {'text': 'Clinic opens at 9 AM.', 'language': language},
                    format='json',
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(generate.call_args.kwargs['language'], code)

        self.assertEqual(generate.call_count, len(NOTICE_LANGUAGES))

