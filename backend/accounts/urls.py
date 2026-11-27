from django.urls import path

from . import views


urlpatterns = [
    path('csrf/', views.csrf_token, name='auth-csrf'),
    path('signup/', views.SignUpView.as_view(), name='auth-signup'),
    path('login/', views.LoginView.as_view(), name='auth-login'),
    path('logout/', views.LogoutView.as_view(), name='auth-logout'),
    path('me/', views.current_user, name='auth-me'),
]
