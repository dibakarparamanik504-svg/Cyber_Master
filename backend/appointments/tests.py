from datetime import timedelta

from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import QueueTicket


@override_settings(ALLOWED_HOSTS=['testserver'])
class AppointmentApiTests(APITestCase):
    def setUp(self):
        self.list_url = reverse('appointment-list-create')
        self.appointment_data = {
            'patientName': 'Test Patient',
            'age': 35,
            'gender': 'Other',
            'mobile': '1234567890',
            'email': '',
            'patientId': '',
            'date': (timezone.localdate() + timedelta(days=1)).isoformat(),
            'time': '10:00 AM',
            'type': 'New Consultation',
            'visit': 'First Visit',
            'reason': 'Routine consultation',
        }

    def test_booking_is_saved_and_limited_to_its_browser_session(self):
        response = self.client.post(self.list_url, self.appointment_data, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['patientName'], 'Test Patient')
        self.assertEqual(response.data['status'], 'Confirmed')
        self.assertEqual(len(self.client.get(self.list_url).data), 1)

        another_client = self.client_class()
        self.assertEqual(another_client.get(self.list_url).data, [])
        detail_url = reverse(
            'appointment-detail',
            kwargs={'reference': response.data['reference']},
        )
        self.assertEqual(
            another_client.delete(detail_url).status_code,
            404,
        )

    def test_conflicting_confirmed_slots_are_rejected(self):
        first = self.client.post(self.list_url, self.appointment_data, format='json')
        second = self.client.post(self.list_url, self.appointment_data, format='json')

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 400)
        self.assertIn('time', second.data)

    def test_cancelled_slot_becomes_available(self):
        booking = self.client.post(self.list_url, self.appointment_data, format='json')
        detail_url = reverse(
            'appointment-detail',
            kwargs={'reference': booking.data['reference']},
        )

        cancelled = self.client.delete(detail_url)
        self.assertEqual(cancelled.status_code, 200)
        self.assertEqual(cancelled.data['status'], 'Cancelled')

        replacement = self.client.post(self.list_url, self.appointment_data, format='json')
        self.assertEqual(replacement.status_code, 201)

    def test_reschedule_updates_the_booking_and_slot_availability(self):
        booking = self.client.post(self.list_url, self.appointment_data, format='json')
        detail_url = reverse(
            'appointment-detail',
            kwargs={'reference': booking.data['reference']},
        )
        new_date = (timezone.localdate() + timedelta(days=2)).isoformat()
        updated_data = {
            **self.appointment_data,
            'date': new_date,
            'time': '11:00 AM',
        }

        response = self.client.put(detail_url, updated_data, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['date'], new_date)
        old_availability = self.client.get(
            reverse('appointment-availability'),
            {'date': self.appointment_data['date']},
        )
        new_availability = self.client.get(
            reverse('appointment-availability'),
            {'date': new_date},
        )
        self.assertEqual(old_availability.data['occupiedSlots'], [])
        self.assertEqual(new_availability.data['occupiedSlots'], ['11:00 AM'])

    def test_invalid_mobile_is_rejected(self):
        invalid_data = {**self.appointment_data, 'mobile': '123'}

        response = self.client.post(self.list_url, invalid_data, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('mobile', response.data)

    def test_booking_issues_queue_token_with_session_scoped_verification_code(self):
        response = self.client.post(self.list_url, self.appointment_data, format='json')

        self.assertEqual(response.status_code, 201)
        queue = response.data['queue']
        self.assertTrue(queue['reference'].startswith('Q-'))
        self.assertEqual(len(queue['verificationCode']), 6)
        self.assertNotEqual(
            QueueTicket.objects.get().verification_hash,
            queue['verificationCode'],
        )
        self.assertEqual(
            self.client.get(self.list_url).data[0]['queue']['verificationCode'],
            queue['verificationCode'],
        )

    def test_queue_tracking_requires_the_issued_verification_code(self):
        booking = self.client.post(self.list_url, self.appointment_data, format='json')
        queue = booking.data['queue']
        track_url = reverse('queue-track')

        invalid = self.client.post(
            track_url,
            {
                'reference': queue['reference'],
                'verification_code': '000000',
            },
            format='json',
        )
        valid = self.client.post(
            track_url,
            {
                'reference': queue['reference'],
                'verification_code': queue['verificationCode'],
            },
            format='json',
        )

        self.assertEqual(invalid.status_code, 401)
        self.assertEqual(valid.status_code, 200)
        self.assertEqual(valid.data['status'], 'generated')
        self.assertIsNone(valid.data['estimated_wait_minutes'])

    def test_queue_summary_uses_today_appointments_only(self):
        today_booking = {
            **self.appointment_data,
            'date': timezone.localdate().isoformat(),
            'time': '10:00 AM',
        }
        response = self.client.post(self.list_url, today_booking, format='json')

        self.assertEqual(response.status_code, 201)
        summary = self.client.get(reverse('queue-summary')).data

        self.assertEqual(summary['active_queues'], 1)
        self.assertEqual(summary['patients_waiting'], 1)
        self.assertEqual(summary['completed_today'], 0)

    def test_cancelling_appointment_cancels_its_queue_token(self):
        booking = self.client.post(self.list_url, self.appointment_data, format='json')
        detail_url = reverse(
            'appointment-detail',
            kwargs={'reference': booking.data['reference']},
        )

        response = self.client.delete(detail_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['queue']['status'], 'cancelled')
