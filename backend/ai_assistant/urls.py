from django.urls import path

from .views import chat, conversation_history


urlpatterns = [
    path('chat/', chat, name='ai-assistant-chat'),
    path(
        'conversations/<uuid:conversation_id>/',
        conversation_history,
        name='ai-assistant-history',
    ),
]
