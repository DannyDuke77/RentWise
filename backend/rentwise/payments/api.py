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
from accounts.permissions import HasBusinessContext, IsBusinessManagerOrOwner
from properties.models import Tenancy
from .models import MpesaConfiguration, MpesaTransaction
from .serializers import MpesaConfigurationSerializer, MpesaPaymentSerializer
from .services.mpesa_callback_service import process_mpesa_callback
from .services.payment_service import initiate_mpesa_payment
from .services.exceptions import MpesaNotConfigured, MpesaDisabled, MpesaInitiationFailed

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
    serializer_class = MpesaConfigurationSerializer
    lookup_field = "id"

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            permission_classes = [
                IsAuthenticated,
                HasBusinessContext,
                IsBusinessManagerOrOwner,
            ]
        else:
            permission_classes = [
                IsAuthenticated,
                HasBusinessContext,
            ]

        return [permission() for permission in permission_classes]

    def get_business(self):
        business_id = self.request.headers.get("X-Business-ID")

        if not business_id:
            return None

        return get_object_or_404(Business, id=business_id, memberships__user=self.request.user,)

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

        serializer.save()

    def perform_destroy(self, instance):
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

        try:
            mpesa_transaction = initiate_mpesa_payment(
                tenancy=tenancy,
                phone_number=data["phone_number"],
                amount=data["amount"],
                category=data["category"],
                notes=data.get("notes", ""),
                account_reference=tenancy.unit.name,
                transaction_description=(
                    f"RentWise payment - "
                    f"{tenancy.unit.property.name} - {tenancy.unit.name}"
                ),
                callback_url=callback_url,
            )
        except MpesaNotConfigured as exc:
            return Response({"detail": str(exc)}, status=400)
        except MpesaDisabled as exc:
            return Response({"detail": str(exc)}, status=409)
        except MpesaInitiationFailed as exc:
            return Response({"detail": str(exc)}, status=502)

        return Response({
            "success": True,
            "message": "STK Push sent successfully.",
            "transaction_id": str(mpesa_transaction.id),
            "checkout_request_id": mpesa_transaction.checkout_request_id,
            "status": mpesa_transaction.status,
        }, status=201)

class MpesaTransactionStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, transaction_id):
        transaction = get_object_or_404(
            MpesaTransaction,
            id=transaction_id,
            tenancy__tenancy_members__tenant__user=request.user,
            tenancy__tenancy_members__is_active=True,
        )

        return Response({
            "transaction_id": str(transaction.id),
            "status": transaction.status,
            "result_code": transaction.result_code,
            "result_description": transaction.result_description,
            "mpesa_receipt_number": transaction.mpesa_receipt_number,
            "completed_at": transaction.completed_at,
        })