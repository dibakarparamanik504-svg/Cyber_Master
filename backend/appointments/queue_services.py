import uuid

from django.utils import timezone

from .models import QueueTicket


def create_queue_ticket(appointment):
    code = QueueTicket.create_verification_code()
    ticket = QueueTicket(
        reference=f'Q-{uuid.uuid4().hex[:8].upper()}',
        appointment=appointment,
        status=(
            'waiting'
            if appointment.date == timezone.localdate()
            else 'generated'
        ),
    )
    ticket.set_verification_code(code)
    ticket.save()
    return ticket, code


def save_queue_code_in_session(request, ticket, code):
    codes = request.session.get('queue_verification_codes', {})
    codes[ticket.reference] = code
    request.session['queue_verification_codes'] = dict(list(codes.items())[-50:])
