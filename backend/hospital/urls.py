from django.urls import path

from . import views


urlpatterns = [
    path('profile/', views.hospital_profile, name='hospital-profile'),
    path('notices/', views.notices, name='hospital-notices'),
    path('notices/drafts/', views.notice_drafts, name='notice-drafts'),
    path('feedback/', views.submit_feedback, name='hospital-feedback'),
    path('departments/', views.departments, name='department-list'),
    path('departments/discover/', views.department_discovery, name='department-discovery'),
    path('specialists/', views.specialists, name='specialist-list'),
    path('facilities/', views.facilities, name='facility-list'),
    path('ai/notice-summary/', views.notice_summary, name='notice-summary'),
    path('ai/translate/', views.notice_translate, name='notice-translate'),
]
