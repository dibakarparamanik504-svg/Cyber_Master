from django.urls import path

from . import queue_views


urlpatterns = [
    path('summary/', queue_views.queue_summary, name='queue-summary'),
    path('analytics/', queue_views.queue_analytics, name='queue-analytics'),
    path('track/', queue_views.track_queue, name='queue-track'),
]
