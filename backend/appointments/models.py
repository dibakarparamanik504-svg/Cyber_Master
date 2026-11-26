from uuid import uuid4
from secrets import randbelow

from django.contrib.auth.hashers import check_password, make_password
from django.db import models
from django.db.models import Q
from django.utils import timezone


def create_reference():
    return f'SQ-{uuid4().hex[:8].upper()}'


class Appointment(models.Model):
    APPOINTMENT_TYPES = [
        ('New Consultation', 'New Consultation'),
        ('Follow-up Visit', 'Follow-up Visit'),
        ('Routine Check-up', 'Routine Check-up'),
        ('Specialist Consultation', 'Specialist Consultation'),
    ]
    GENDERS = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
        ('Prefer not to say', 'Prefer not to say'),
    ]
    VISIT_TYPES = [
        ('First Visit', 'First Visit'),
        ('Follow-up', 'Follow-up'),
    ]
    TIME_SLOTS = [
        ('09:00 AM', '09:00 AM'),
        ('09:30 AM', '09:30 AM'),
        ('10:00 AM', '10:00 AM'),
        ('10:30 AM', '10:30 AM'),
        ('11:00 AM', '11:00 AM'),
        ('11:30 AM', '11:30 AM'),
        ('12:00 PM', '12:00 PM'),
        ('12:30 PM', '12:30 PM'),
        ('02:00 PM', '02:00 PM'),
        ('02:30 PM', '02:30 PM'),
        ('03:00 PM', '03:00 PM'),
        ('03:30 PM', '03:30 PM'),
        ('04:00 PM', '04:00 PM'),
        ('04:30 PM', '04:30 PM'),
        ('05:00 PM', '05:00 PM'),
    ]
    STATUSES = [
        ('Confirmed', 'Confirmed'),
        ('Cancelled', 'Cancelled'),
    ]

    reference = models.CharField(max_length=11, unique=True, default=create_reference)
    owner_token = models.CharField(max_length=64, db_index=True)
    patient_name = models.CharField(max_length=120)
    age = models.PositiveSmallIntegerField()
    gender = models.CharField(max_length=20, choices=GENDERS)
    mobile = models.CharField(max_length=10)
    email = models.EmailField(blank=True)
    patient_id = models.CharField(max_length=64, blank=True)
    date = models.DateField()
    time = models.CharField(max_length=8, choices=TIME_SLOTS)
    type = models.CharField(max_length=32, choices=APPOINTMENT_TYPES)
    visit = models.CharField(max_length=16, choices=VISIT_TYPES)
    reason = models.TextField(max_length=1000)
    status = models.CharField(max_length=10, choices=STATUSES, default='Confirmed')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['date', 'time'],
                condition=Q(status='Confirmed'),
                name='unique_confirmed_appointment_slot',
            ),
        ]

    def __str__(self):
        return f'{self.reference} - {self.patient_name}'


class QueueTicket(models.Model):
    STATUSES = [
        ('generated', 'Generated'),
        ('waiting', 'Waiting'),
        ('next', 'Next'),
        ('serving', 'Serving'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    reference = models.CharField(max_length=16, unique=True)
    appointment = models.OneToOneField(
        Appointment,
        related_name='queue_ticket',
        on_delete=models.CASCADE,
    )
    verification_hash = models.CharField(max_length=128)
    status = models.CharField(max_length=10, choices=STATUSES, default='generated')
    is_delayed = models.BooleanField(default=False)
    called_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        ordering = ['appointment__date', 'created_at']

    @staticmethod
    def create_verification_code():
        return f'{randbelow(900000) + 100000}'

    def set_verification_code(self, code):
        self.verification_hash = make_password(code)

    def verify_code(self, code):
        return check_password(code, self.verification_hash)

    def save(self, *args, **kwargs):
        now = timezone.now()
        update_fields = kwargs.get('update_fields')
        if self.status == 'serving' and self.called_at is None:
            self.called_at = now
            if update_fields is not None:
                kwargs['update_fields'] = set(update_fields) | {'called_at'}
        if self.status == 'completed' and self.completed_at is None:
            self.completed_at = now
            if update_fields is not None:
                kwargs['update_fields'] = set(kwargs.get('update_fields', update_fields)) | {'completed_at'}
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.reference} - {self.appointment.patient_name}'
