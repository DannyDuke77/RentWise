from dj_rest_auth.jwt_auth import get_refresh_view
from dj_rest_auth.registration.views import RegisterView
from dj_rest_auth.views import LoginView, LogoutView

from rest_framework_simplejwt.views import TokenObtainPairView

from django.urls import path

from . import api

from .views import CustomRegisterView, CustomTokenObtainPairView

urlpatterns = [
    path('register/', CustomRegisterView.as_view(), name='rest_register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='rest_login'),
    path('logout/', LogoutView.as_view(), name='rest_logout'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', get_refresh_view().as_view(), name='token_refresh'),
    path("settings/business-profile/", api.BusinessProfileView.as_view(), name="business-profile"),
    path("settings/user-settings/", api.UserSettingsView.as_view(), name="user-settings"),
]