from dj_rest_auth.jwt_auth import get_refresh_view
from rest_framework.routers import DefaultRouter
from dj_rest_auth.views import LogoutView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.urls import path, include

from . import api
from .views import CustomRegisterView, CustomTokenObtainPairView

router = DefaultRouter()
router.register(r"businesses", api.BusinessViewSet, basename="business")

urlpatterns = [
    path("api/auth/me/", api.CurrentUserView.as_view(), name="current-user"),
    path('api/auth/register/', CustomRegisterView.as_view(), name='rest_register'),
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='rest_login'),
    path('api/auth/logout/', LogoutView.as_view(), name='rest_logout'),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', get_refresh_view().as_view(), name='token_refresh'),
    path("api/auth/settings/", api.UserSettingsView.as_view(), name="settings"),
    path("api/business-invitations/<uuid:token>/", api.BusinessInvitationView.as_view(), name="business-invitation"),
    path("api/", include(router.urls)),
]