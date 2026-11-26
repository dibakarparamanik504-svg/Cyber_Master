import uuid

from django.db import models


class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner_token = models.CharField(max_length=64, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)


class Message(models.Model):
    ROLES = [
        ('user', 'User'),
        ('model', 'Model'),
    ]

    conversation = models.ForeignKey(
        Conversation,
        related_name='messages',
        on_delete=models.CASCADE,
    )
    role = models.CharField(max_length=8, choices=ROLES)
    text = models.TextField(max_length=4000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at', 'pk']
