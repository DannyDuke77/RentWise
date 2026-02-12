from django.shortcuts import render

from dj_rest_auth.registration.views import RegisterView

from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import CustomRegisterSerializer, CustomTokenObtainPairSerializer

# Create your views here.

class CustomRegisterView(RegisterView):
    serializer_class = CustomRegisterSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer