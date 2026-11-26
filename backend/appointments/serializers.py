import re

from django.utils import timezone
from rest_framework import serializers

from .models import Appointment, QueueTicket


class AppointmentSerializer(serializers.ModelSerializer):
    patientName = serializers.CharField(source='patient_name', max_length=120)
    patientId = serializers.CharField(
        source='patient_id', max_length=64, required=False, allow_blank=True
    )
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    queue = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        validators = []
        fields = [
            'reference',
            'patientName',
            'age',
            'gender',
            'mobile',
            'email',
            'patientId',
            'date',
            'time',
            'type',
            'visit',
            'reason',
            'status',
            'createdAt',
            'updatedAt',
            'queue',
        ]
        read_only_fields = ['reference', 'status', 'createdAt', 'updatedAt']

    def get_queue(self, appointment):
        try:
            ticket = appointment.queue_ticket
        except QueueTicket.DoesNotExist:
            return None
        verification_codes = self.context.get('queue_codes', {})
        return {
            'reference': ticket.reference,
            'status': ticket.status,
            'verificationCode': verification_codes.get(ticket.reference),
        }

    def validate_age(self, value):
        if value < 1 or value > 120:
            raise serializers.ValidationError('Age must be between 1 and 120.')
        return value

    def validate_mobile(self, value):
        if not re.fullmatch(r'[0-9]{10}', value):
            raise serializers.ValidationError('Enter a valid 10-digit mobile number.')
        return value

    def validate_date(self, value):
        if value < timezone.localdate():
            raise serializers.ValidationError('Appointment date cannot be in the past.')
        return value

    def validate_reason(self, value):
        if not value.strip():
            raise serializers.ValidationError('Booking reason is required.')
        return value.strip()

    def validate(self, attrs):
        appointment_date = attrs.get('date', getattr(self.instance, 'date', None))
        appointment_time = attrs.get('time', getattr(self.instance, 'time', None))
        if appointment_date and appointment_time:
            conflicts = Appointment.objects.filter(
                date=appointment_date,
                time=appointment_time,
                status='Confirmed',
            )
            if self.instance:
                conflicts = conflicts.exclude(pk=self.instance.pk)
            if conflicts.exists():
                raise serializers.ValidationError(
                    {'time': 'This time slot is already booked. Select another slot.'}
                )
        return attrs
