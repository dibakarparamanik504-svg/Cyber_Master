from django.contrib import admin

from .models import Appointment, QueueTicket


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('reference', 'patient_name', 'date', 'time', 'status')
    list_filter = ('date', 'status', 'type')
    search_fields = ('reference', 'patient_name', 'mobile')
    readonly_fields = ('reference', 'owner_token', 'created_at', 'updated_at')


@admin.register(QueueTicket)
class QueueTicketAdmin(admin.ModelAdmin):
    list_display = ('reference', 'appointment', 'status', 'is_delayed', 'updated_at')
    list_filter = ('status', 'is_delayed', 'appointment__date')
    search_fields = ('reference', 'appointment__reference', 'appointment__patient_name')
    readonly_fields = (
        'reference',
        'appointment',
        'created_at',
        'updated_at',
        'called_at',
        'completed_at',
    )
    exclude = ('verification_hash',)
