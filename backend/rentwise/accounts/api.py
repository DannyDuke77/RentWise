from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.response import Response

from .models import BusinessProfile
from .serializers import BusinessProfileSerializer, UserSettingsSerializer

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_object(request):
    # business logic here
    return Response({"detail": "object created"})

class BusinessProfileView(RetrieveUpdateAPIView):
    serializer_class = BusinessProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Get or create profile for current user
        profile, created = BusinessProfile.objects.get_or_create(user=self.request.user)
        return profile
    
class UserSettingsView(RetrieveUpdateAPIView):
    serializer_class = UserSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Return the current user
        return self.request.user