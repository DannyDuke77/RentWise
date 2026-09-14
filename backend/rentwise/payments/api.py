from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from django.conf import settings

from accounts.models import Business, BusinessMembership
from properties.models import Tenancy
from .models import MpesaConfiguration
from .serializers import MpesaConfigurationSerializer, MpesaPaymentSerializer
from .services.mpesa_callback_service import process_mpesa_callback
from .services.payment_service import initiate_mpesa_payment

@csrf_exempt
def mpesa_callback(request):
    if request.method != "POST":
        return JsonResponse(
            {"ResultCode": 1, "ResultDesc": "Invalid request method"},
            status=405,
        )

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse(
            {"ResultCode": 1, "ResultDesc": "Invalid JSON"},
            status=400,
        )

    try:
        process_mpesa_callback(data)
    except Exception as exc:
        print(f"--- M-PESA CALLBACK PROCESSING FAILED ---")
        print(str(exc))

        return JsonResponse({
            "ResultCode": 1,
            "ResultDesc": "Callback processing failed",
        }, status=500)

    return JsonResponse({
        "ResultCode": 0,
        "ResultDesc": "Accepted",
    })

class MpesaConfigurationViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = MpesaConfigurationSerializer
    lookup_field = "id"

    def get_business(self):
        business_id = self.request.headers.get("X-Business-ID")

        if not business_id:
            return None

        return get_object_or_404(Business, id=business_id, memberships__user=self.request.user,)

    def check_owner(self, business):
        if not BusinessMembership.objects.filter(
            business=business,
            user=self.request.user,
            role="owner",
        ).exists():
            raise PermissionDenied(
                "Only the business owner can manage M-Pesa configuration."
            )

    def get_queryset(self):
        business = self.get_business()

        if not business:
            return MpesaConfiguration.objects.none()

        return MpesaConfiguration.objects.filter(business=business)
    
    def perform_create(self, serializer):
        business = self.get_business()

        if not business:
            raise ValidationError({
                "business": "Business context is required."
            })

        self.check_owner(business)

        serializer.save(business=business)

    def perform_update(self, serializer):
        business = self.get_business()

        if not business:
            raise ValidationError({
                "business": "Business context is required."
            })

        self.check_owner(business)

        serializer.save()

    def perform_destroy(self, instance):
        self.check_owner(instance.business)
        instance.delete()

class InitiateMpesaPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = MpesaPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        tenancy = get_object_or_404(
            Tenancy,
            id=data["tenancy_id"],
            is_active=True,
            tenancy_members__tenant__user=request.user,
            tenancy_members__is_active=True,
        )


        callback_url = (
            f"{settings.MPESA_CALLBACK_BASE_URL}"
            "/api/v1/payments/callback/"
        )

        mpesa_transaction = initiate_mpesa_payment(
            tenancy=tenancy,
            phone_number=data["phone_number"],
            amount=data["amount"],
            category=data["category"],
            notes=data.get("notes", ""),
            account_reference=tenancy.unit.name,
            transaction_description=f"RentWise payment - {tenancy.unit.property.name} - {tenancy.unit.name}",
            callback_url=callback_url,
        )

        return Response({
            "success": True,
            "message": "STK Push sent successfully.",
            "transaction_id": str(mpesa_transaction.id),
            "checkout_request_id": mpesa_transaction.checkout_request_id,
            "status": mpesa_transaction.status,
        }, status=201)