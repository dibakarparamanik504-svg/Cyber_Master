from django.urls import path

from . import views


urlpatterns = [
    path('appointments/', views.appointment_collection, name='appointment-list-create'),
    path(
        'appointments/availability/',
        views.appointment_availability,
        name='appointment-availability',
    ),
    path(
        'appointments/<str:reference>/',
        views.appointment_detail,
        name='appointment-detail',
    ),
]
