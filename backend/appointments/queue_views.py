from datetime import datetime

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import QueueTicket


ACTIVE_STATUSES = ('generated', 'waiting', 'next', 'serving')


def appointment_sort_key(ticket):
    slot = datetime.strptime(ticket.appointment.time, '%I:%M %p').time()
    return slot, ticket.created_at, ticket.pk


def refresh_today_tickets():
    QueueTicket.objects.filter(
        appointment__date=timezone.localdate(),
        status='generated',
        appointment__status='Confirmed',
    ).update(status='waiting', updated_at=timezone.now())


def queue_summary_data():
    refresh_today_tickets()
    today = QueueTicket.objects.filter(
        appointment__date=timezone.localdate(),
        appointment__status='Confirmed',
    )
    return {
        'active_queues': int(today.filter(status__in=ACTIVE_STATUSES).exists()),
        'patients_waiting': today.filter(
            status__in=('generated', 'waiting', 'next')
        ).count(),
        'currently_serving': today.filter(status='serving').count(),
        'completed_today': today.filter(status='completed').count(),
    }


def queue_analytics_data():
    refresh_today_tickets()
    today = list(
        QueueTicket.objects.filter(
            appointment__date=timezone.localdate(),
            appointment__status='Confirmed',
        )
    )
    total = len(today)
    completed = sum(ticket.status == 'completed' for ticket in today)
    delayed = sum(ticket.is_delayed for ticket in today)
    hourly_counts = {hour: 0 for hour in range(9, 18)}
    for ticket in today:
        hour = datetime.strptime(ticket.appointment.time, '%I:%M %p').hour
        if hour in hourly_counts:
            hourly_counts[hour] += 1

    return {
        'average_wait_minutes': None,
        'completion_rate': round(completed * 100 / total) if total else 0,
        'delay_frequency': round(delayed * 100 / total) if total else 0,
        'hourly_volume': [
            {
                'time': f'{hour % 12 or 12} {"AM" if hour < 12 else "PM"}',
                'value': value,
            }
            for hour, value in hourly_counts.items()
        ],
    }


@api_view(['GET'])
def queue_summary(request):
    return Response(queue_summary_data())


@api_view(['GET'])
def queue_analytics(request):
    return Response(queue_analytics_data())


@api_view(['POST'])
def track_queue(request):
    reference = str(request.data.get('reference', '')).strip().upper()
    verification_code = str(request.data.get('verification_code', '')).strip()
    if not reference or not verification_code:
        return Response(
            {'detail': 'Queue reference and verification code are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    ticket = (
        QueueTicket.objects.select_related('appointment')
        .filter(reference=reference)
        .first()
    )
    if ticket is None or not ticket.verify_code(verification_code):
        return Response(
            {'detail': 'Verification failed. Check your queue details.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    if ticket.appointment.date < timezone.localdate():
        return Response(
            {'detail': 'This appointment date has passed.'},
            status=status.HTTP_410_GONE,
        )
    if ticket.appointment.status != 'Confirmed' or ticket.status == 'cancelled':
        return Response(
            {'detail': 'This queue token is no longer active.'},
            status=status.HTTP_410_GONE,
        )

    refresh_today_tickets()
    if (
        ticket.appointment.date == timezone.localdate()
        and ticket.status == 'generated'
    ):
        ticket.refresh_from_db(fields=['status', 'updated_at'])
    active = list(
        QueueTicket.objects.select_related('appointment')
        .filter(
            appointment__date=ticket.appointment.date,
            appointment__status='Confirmed',
            status__in=ACTIVE_STATUSES,
        )
    )
    active.sort(key=appointment_sort_key)
    position = next(
        (index + 1 for index, item in enumerate(active) if item.pk == ticket.pk),
        0,
    )
    current_ticket = next(
        (item for item in active if item.status == 'serving'),
        None,
    )
    if ticket.appointment.date > timezone.localdate():
        status_label = 'generated'
        position = 0
    else:
        status_label = ticket.status
    if status_label == 'completed':
        progress = 100
    elif position and active:
        progress = round((position - 1) * 100 / len(active))
    else:
        progress = 0

    return Response({
        'token': ticket.reference,
        'status': status_label,
        'position': position,
        'patients_ahead': max(position - 1, 0),
        'current_serving_token': current_ticket.reference if current_ticket else None,
        'estimated_wait_minutes': None,
        'prediction_confidence': None,
        'progress': progress,
        'last_updated': ticket.updated_at,
    })
