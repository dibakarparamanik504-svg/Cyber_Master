from secrets import token_urlsafe

from django.db import IntegrityError
from django.db import transaction
from django.utils.dateparse import parse_date
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Appointment, QueueTicket
from .queue_services import create_queue_ticket, save_queue_code_in_session
from .serializers import AppointmentSerializer


def get_owner_token(request, create=False):
    owner_token = request.session.get('appointment_owner')
    if not owner_token and create:
        owner_token = token_urlsafe(32)
        request.session['appointment_owner'] = owner_token
    return owner_token


def serializer_context(request):
    return {'queue_codes': request.session.get('queue_verification_codes', {})}


@api_view(['GET', 'POST'])
def appointment_collection(request):
    if request.method == 'GET':
        owner_token = get_owner_token(request)
        appointments = Appointment.objects.filter(owner_token=owner_token) if owner_token else []
        return Response(
            AppointmentSerializer(
                appointments,
                many=True,
                context=serializer_context(request),
            ).data
        )

    serializer = AppointmentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        with transaction.atomic():
            appointment = serializer.save(
                owner_token=get_owner_token(request, create=True)
            )
            ticket, verification_code = create_queue_ticket(appointment)
            save_queue_code_in_session(request, ticket, verification_code)
    except IntegrityError:
        return Response(
            {'detail': 'This time slot has just been booked. Choose another slot.'},
            status=status.HTTP_409_CONFLICT,
        )
    return Response(
        AppointmentSerializer(
            appointment,
            context=serializer_context(request),
        ).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
def appointment_availability(request):
    date_value = parse_date(request.query_params.get('date', ''))
    if not date_value:
        return Response(
            {'date': 'Provide a valid date in YYYY-MM-DD format.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    occupied_slots = Appointment.objects.filter(
        date=date_value,
        status='Confirmed',
    ).values_list('time', flat=True)
    return Response({'date': date_value, 'occupiedSlots': list(occupied_slots)})


@api_view(['PUT', 'DELETE'])
def appointment_detail(request, reference):
    owner_token = get_owner_token(request)
    if not owner_token:
        return Response({'detail': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

    try:
        appointment = Appointment.objects.get(
            reference=reference,
            owner_token=owner_token,
        )
    except Appointment.DoesNotExist:
        return Response({'detail': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        if appointment.status != 'Confirmed':
            return Response(
                {'detail': 'Only confirmed appointments can be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            ticket = appointment.queue_ticket
        except QueueTicket.DoesNotExist:
            ticket = None
        if ticket and ticket.status in ('serving', 'completed'):
            return Response(
                {'detail': 'An appointment already in service cannot be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        appointment.status = 'Cancelled'
        appointment.save(update_fields=['status', 'updated_at'])
        if ticket:
            ticket.status = 'cancelled'
            ticket.save(update_fields=['status', 'updated_at'])
        return Response(
            AppointmentSerializer(
                appointment,
                context=serializer_context(request),
            ).data
        )

    if appointment.status != 'Confirmed':
        return Response(
            {'detail': 'Only confirmed appointments can be rescheduled.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        ticket = appointment.queue_ticket
    except QueueTicket.DoesNotExist:
        ticket = None
    if ticket and ticket.status in ('serving', 'completed'):
        return Response(
            {'detail': 'An appointment already in service cannot be rescheduled.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = AppointmentSerializer(appointment, data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        appointment = serializer.save()
        if ticket:
            ticket.status = (
                'waiting'
                if appointment.date == timezone.localdate()
                else 'generated'
            )
            ticket.save(update_fields=['status', 'updated_at'])
    except IntegrityError:
        return Response(
            {'detail': 'This time slot has just been booked. Choose another slot.'},
            status=status.HTTP_409_CONFLICT,
        )
    return Response(
        AppointmentSerializer(
            appointment,
            context=serializer_context(request),
        ).data
    )
