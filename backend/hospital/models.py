from django.db import models


class HospitalProfile(models.Model):
    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    name = models.CharField(max_length=160, default='PULSELINE Hospital')
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=40, blank=True)
    email = models.EmailField(blank=True)
    contact_hours = models.CharField(max_length=120, blank=True)
    introduction = models.TextField(blank=True)
    history = models.TextField(blank=True)
    mission = models.TextField(blank=True)
    vision = models.TextField(blank=True)
    total_staff = models.PositiveIntegerField(null=True, blank=True)
    available_beds = models.PositiveIntegerField(null=True, blank=True)
    infrastructure_count = models.PositiveIntegerField(null=True, blank=True)
    emergency_support = models.CharField(max_length=120, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Department(models.Model):
    CATEGORIES = [
        ('Medicine', 'Medicine'),
        ('Surgery', 'Surgery'),
        ('Diagnostics', 'Diagnostics'),
    ]

    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=20, choices=CATEGORIES)
    icon = models.CharField(max_length=16, blank=True)
    tagline = models.CharField(max_length=120, blank=True)
    description = models.TextField()
    services = models.JSONField(default=list, blank=True)
    facilities = models.JSONField(default=list, blank=True)
    floor = models.CharField(max_length=120, blank=True)
    hours = models.CharField(max_length=120, blank=True)
    contact = models.CharField(max_length=120, blank=True)
    phone_extension = models.CharField(max_length=40, blank=True)
    official_email = models.EmailField(blank=True)
    color = models.CharField(max_length=24, blank=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Specialist(models.Model):
    department = models.ForeignKey(
        Department,
        related_name='specialists',
        on_delete=models.PROTECT,
    )
    name = models.CharField(max_length=120)
    qualification = models.CharField(max_length=160, blank=True)
    experience_years = models.PositiveSmallIntegerField(null=True, blank=True)
    languages = models.JSONField(default=list, blank=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['department__name', 'name']

    def __str__(self):
        return f'{self.name} - {self.department.name}'


class Facility(models.Model):
    name = models.CharField(max_length=120, unique=True)
    icon = models.CharField(max_length=16, blank=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=120, default='Availability not verified')
    details = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Notice(models.Model):
    title = models.CharField(max_length=160)
    body = models.TextField(max_length=10000)
    owner_token = models.CharField(max_length=64, blank=True, db_index=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Feedback(models.Model):
    owner_token = models.CharField(max_length=64, db_index=True)
    category = models.CharField(max_length=80, default='General')
    department = models.ForeignKey(
        Department,
        null=True,
        blank=True,
        related_name='feedback',
        on_delete=models.SET_NULL,
    )
    rating = models.PositiveSmallIntegerField()
    message = models.TextField(max_length=2000, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.category}: {self.rating}/5'
