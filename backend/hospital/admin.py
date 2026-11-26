from django.contrib import admin

from .models import Department, Facility, Feedback, HospitalProfile, Notice, Specialist


@admin.register(HospitalProfile)
class HospitalProfileAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return not HospitalProfile.objects.exists()


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'is_verified', 'is_active')
    list_filter = ('category', 'is_verified', 'is_active')
    search_fields = ('name', 'description')


@admin.register(Specialist)
class SpecialistAdmin(admin.ModelAdmin):
    list_display = ('name', 'department', 'is_verified', 'is_active')
    list_filter = ('department', 'is_verified', 'is_active')
    search_fields = ('name', 'qualification')


@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ('name', 'status', 'is_verified', 'is_active')
    list_filter = ('is_verified', 'is_active')
    search_fields = ('name', 'description')


@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_published', 'created_at')
    list_filter = ('is_published',)
    search_fields = ('title', 'body')
    readonly_fields = ('owner_token', 'created_at', 'updated_at')


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('category', 'department', 'rating', 'created_at')
    list_filter = ('category', 'department', 'rating')
    search_fields = ('message',)
    readonly_fields = ('owner_token', 'category', 'department', 'rating', 'message', 'created_at')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
