from django.http import HttpResponse
from rest_framework.viewsets import ModelViewSet
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from django.db.models import Q, Prefetch
from django.shortcuts import get_object_or_404
from datetime import datetime

from .serializers import (
    PropertyDetailSerializer, UnitDetailSerializer, TenantSerializer, 
    UnitPaymentCreateSerializer, UnitPaymentSerializer, ChargeStatusUpdateSerializer, 
    TenancyDropdownSerializer, ChargeSerializer, ChargeTypeSerializer, ChargeCreateSerializer
)
from .models import Property, TenantInvitation, Unit, Tenant, UnitPayment, Tenancy, Charge, ChargeType, TenancyMember

from accounts.permissions import IsLandlordOrAdmin

# Services
from .services.reports import get_property_audit_data, generate_property_audit_pdf
from .services.payment_service import process_payment, get_payment_analytics
from .services.charge_service import update_charge_status
from .services.tenancy_service import accept_tenant_invitation, vacate_unit, add_tenant_or_roommate_to_unit, remove_roommate_from_unit
from .services.unit_service import update_unit
from .services.rent import get_property_dashboard, get_property_units

class Pagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            "message": "Data fetched successfully",
            "success": True,
            "count": self.page.paginator.count,
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
            "results": data,
        })
    
class PropertyViewSet(ModelViewSet):
    permission_classes = [IsLandlordOrAdmin]
    serializer_class = PropertyDetailSerializer
    pagination_class = Pagination
    lookup_field = "id"

    def get_queryset(self):
        queryset = Property.objects.filter(owner=self.request.user, is_active=True).order_by("created_at")

        query = self.request.query_params.get("q")
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) | Q(location__icontains=query)
            )
            
        if self.action in ['retrieve', 'list']:
            queryset = queryset.prefetch_related(
                Prefetch(
                    'units',
                    queryset=Unit.objects.filter(is_active=True).prefetch_related(
                        Prefetch(
                            'tenancies',
                            queryset=Tenancy.objects.filter(is_active=True).prefetch_related(
                                Prefetch(
                                    'tenancy_members',
                                    queryset=TenancyMember.objects.filter(is_active=True).select_related('tenant')
                                )
                            )
                        )
                    )
                )
            )
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=["get"])
    def units(self, request, id=None):
        get_object_or_404(Property, id=id, owner=request.user)
        data = get_property_units(id)
        
        page = self.paginate_queryset(data)
        if page is not None:
            return self.get_paginated_response(page)
        
        return Response(data)
    
    @action(detail=True, methods=['get'], url_path='rent-summary')
    def rent_summary(self, request, id=None):
        """
        Extracts financial aggregations straight from the real dashboard payload.
        """
        get_object_or_404(Property, id=id, owner=request.user)
        dashboard_data = get_property_dashboard(id)
        return Response({
            "id": dashboard_data["property"]["id"],
            "name": dashboard_data["property"]["name"],
            "summary": dashboard_data["summary"]
        })
    
    @action(detail=False, methods=['get'], url_path='types')
    def property_types(self, request):
        return Response([
            {"value": value, "label": label}
            for value, label in Property.PROPERTY_TYPES
        ])

    @action(detail=True, methods=['get'], url_path='audit-report')
    def audit_report(self, request, id=None):
        property_obj = self.get_object() 
        
        try:
            start_date_str = request.query_params.get('start_date')
            end_date_str = request.query_params.get('end_date')
            
            if not start_date_str or not end_date_str:
                return HttpResponse("Start date and end date are required.", status=400)

            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return HttpResponse("Invalid date format. Use YYYY-MM-DD.", status=400)

        audit_data = get_property_audit_data(property_obj, start_date, end_date)
        pdf_buffer = generate_property_audit_pdf(property_obj, audit_data, start_date, end_date)
        
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Position_{property_obj.name}.pdf"'
        return response
    
class UnitViewSet(ModelViewSet):
    permission_classes = [IsLandlordOrAdmin]
    serializer_class = UnitDetailSerializer
    pagination_class = Pagination
    lookup_field = "id"

    def get_queryset(self):
        queryset = Unit.objects.select_related("property").filter(
            property__owner=self.request.user
        )
        property_id = self.request.query_params.get("property")
        if property_id:
            queryset = queryset.filter(property_id=property_id)
            
        if self.action in ['list', 'retrieve']:
            queryset = queryset.prefetch_related(
                Prefetch(
                    'tenancies',
                    queryset=Tenancy.objects.filter(is_active=True).prefetch_related(
                        Prefetch(
                            'tenancy_members',
                            queryset=TenancyMember.objects.filter(is_active=True).select_related('tenant')
                        )
                    )
                )
            )
        return queryset

    def perform_create(self, serializer):
        property_id = self.request.data.get("property")
        property_obj = get_object_or_404(Property, id=property_id, owner=self.request.user)
        serializer.save(property=property_obj)

    def perform_update(self, serializer):
        unit = self.get_object()
        update_unit(unit, serializer, self.request.user)

    @action(detail=False, methods=['get'], url_path='rent-status')
    def rent_status(self, request):
        property_id = request.query_params.get("property")
        if property_id:
            get_object_or_404(Property, id=property_id, owner=request.user)
            dashboard_data = get_property_dashboard(property_id)
            
            formatted_units = [
                {
                    "id": u["id"],
                    "name": u["name"],
                    "monthly_rent": u["monthly_rent"],
                    "rent_status": u["rent_status"]
                }
                for u in dashboard_data["units"]
            ]
            return Response({
                "success": True,
                "units_rent_status": formatted_units
            })
            
        return Response({
            "success": False,
            "message": "Property ID query parameter is required for rent-status view queries."
        }, status=400)
    
    @action(detail=True, methods=['get', 'post'], url_path='payments')
    def manage_payments(self, request, id=None):
        unit = self.get_object()
        tenancy = unit.tenancies.filter(is_active=True).first()

        if not tenancy:
            return Response({
                "payments": [],
                "balance": 0.0,
                "deposit_held": 0.0,
                "monthly_rent": 0.0,
                "status": unit.status,
                "charges": 0.0,
                "charge_details": []
            }, status=200)

        if request.method == 'GET':
            payments = tenancy.payments.all().order_by("-created_at")
            
            paginator = Pagination()
            paginated_payments = paginator.paginate_queryset(payments, request)

            serialized_payments = UnitPaymentSerializer(paginated_payments, many=True).data

            current_balance = tenancy.calculate_balance()
            deposit_held = tenancy.get_deposit_held()
            charges = tenancy.charges.filter(status="pending").order_by("-created_at")
            
            response_data = ({
                "payments": serialized_payments,
                "balance": float(current_balance),
                "deposit_held": float(deposit_held),
                "monthly_rent": float(tenancy.monthly_rent),
                "status": "arrears" if current_balance > 0 else "credit" if current_balance < 0 else "settled",
                "charges": float(sum([c.amount for c in charges])),
                "charge_details": ChargeSerializer(charges, many=True).data
            })

            return paginator.get_paginated_response(response_data)

        if request.method == 'POST':
            serializer = UnitPaymentCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            new_balance = process_payment(tenancy, serializer.validated_data)

            return Response({
                "success": True,
                "message": f"Payment of KES {serializer.validated_data['amount_paid']} recorded successfully",
                "balance": float(new_balance),
                "errors": serializer.errors
            }, status=201)
        
class TenantViewSet(ModelViewSet):
    permission_classes = [IsLandlordOrAdmin]
    serializer_class = TenantSerializer
    pagination_class = Pagination
    queryset = Tenant.objects.all()
    lookup_field = "id"

    def get_permissions(self):
        if self.action in ['invitation', 'accept_invitation']:
            return [AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        queryset = Tenant.objects.filter(
            tenancy_members__tenancy__unit__property__owner=self.request.user
        ).distinct()
        
        if self.action in ['list', 'retrieve', 'unit_tenants']:
            queryset = queryset.prefetch_related(
                Prefetch(
                    'tenancy_members',
                    queryset=TenancyMember.objects.select_related(
                        'tenancy__unit', 
                        'tenancy__unit__property'
                    )
                )
            )
            
        query = self.request.query_params.get("q")
        if query:
            queryset = queryset.filter(full_name__icontains=query)
        return queryset

    @action(detail=False, methods=['get', 'post'], url_path='unit/(?P<unit_id>[^/.]+)')
    def unit_tenants(self, request, unit_id=None):
        unit = get_object_or_404(Unit, id=unit_id)

        if request.method == 'GET':
            tenancy = Tenancy.objects.filter(unit=unit, is_active=True).first()
            if not tenancy:
                return Response({"tenancy_id": None, "tenants": []})
            
            serializer = TenantSerializer(tenancy.tenants.filter(is_active=True).all(), many=True)
            return Response({
                "tenancy_id": tenancy.id,
                "tenants": serializer.data
            })

        if request.method == 'POST':
            billing_start_date = request.data.get('billing_start_date')
            tenancy, tenant, is_roommate = add_tenant_or_roommate_to_unit(
                unit=unit, 
                data=request.data, 
                billing_start_date=billing_start_date
            )
            
            message = "Roommate added successfully" if is_roommate else "Tenant added successfully"
            
            return Response({
                "success": True,
                "message": message,
                "is_roommate": is_roommate,
                "tenancy_id": tenancy.id,
                "tenant_id": tenant.id
            }, status=201)

    @action(detail=False, methods=['get'], url_path='invitation/(?P<token>[^/.]+)')
    def invitation(self, request, token=None):
        invitation = get_object_or_404(TenantInvitation.objects.select_related('tenant'), token=token)

        if invitation.is_accepted:
            return Response({"detail": "This invitation has already been accepted."}, status=status.HTTP_400_BAD_REQUEST)
        
        if invitation.is_expired:
            return Response({"detail": "This invitation has expired."}, status=status.HTTP_400_BAD_REQUEST)

        tenant = invitation.tenant

        if tenant.user:
            return Response({"detail": "This tenant already has an account."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "valid": True,
            "email": invitation.email,
            "full_name": tenant.full_name,
        })

    @action(detail=False, methods=['post'], url_path='invitation/(?P<token>[^/.]+)/accept')
    def accept_invitation(self, request, token=None):
        password = request.data.get("password")
        password_confirm = request.data.get("password_confirm")

        if not password:
            return Response({"detail": "Password is required."}, status=status.HTTP_400_BAD_REQUEST)

        if password != password_confirm:
            return Response({"detail": "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user, tenant = accept_tenant_invitation(token=token, password=password)
        except ValidationError as e:
            return Response({"detail": e.detail}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "success": True,
            "message": "Invitation accepted successfully. You can now log in.",
            "user_id": user.id,
            "tenant_id": tenant.id
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='unit/(?P<unit_id>[^/.]+)/vacate')
    def vacate_unit(self, request, unit_id=None):
        unit = get_object_or_404(Unit, id=unit_id, property__owner=request.user)
        vacate_unit(unit)
        return Response(
            {"success": True, "message": "Unit vacated successfully"}, 
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'], url_path='unit/(?P<unit_id>[^/.]+)/remove-roommate/(?P<tenant_id>[^/.]+)')
    def remove_roommate(self, request, unit_id=None, tenant_id=None):
        unit = get_object_or_404(Unit, id=unit_id, property__owner=request.user)
        remove_roommate_from_unit(unit, tenant_id)
        return Response(
            {"success": True, "message": "Roommate removed successfully"}, 
            status=status.HTTP_200_OK
        )

class PaymentViewSet(ModelViewSet):
    permission_classes = [IsLandlordOrAdmin]
    pagination_class = Pagination
    lookup_field = 'id'
    serializer_class = UnitPaymentSerializer

    def get_queryset(self):
        queryset = UnitPayment.objects.select_related(
            "tenancy", "tenancy__unit", "tenancy__unit__property"
        ).filter(tenancy__unit__property__owner=self.request.user)

        tenancy_id = self.request.query_params.get("tenancy_id")
        unit_id = self.request.query_params.get("unit_id")

        if tenancy_id:
            queryset = queryset.filter(tenancy_id=tenancy_id)
        elif unit_id:
            queryset = queryset.filter(tenancy__unit_id=unit_id)

        return queryset.order_by("-paid_on")

    @action(detail=False, methods=["get"], url_path="analytics")
    def analytics(self, request):
        return Response(
            get_payment_analytics(request.user)
        )

    @action(detail=False,methods=["get"],url_path="property/(?P<property_id>[^/.]+)/analytics")
    def property_analytics(self, request, property_id=None):
        get_object_or_404(
            Property,
            id=property_id,
            owner=request.user
        )

        return Response(
            get_payment_analytics(
                request.user,
                property_id=property_id
            )
        )
    
class ChargeTypeViewSet(ModelViewSet):
    serializer_class = ChargeTypeSerializer
    permission_classes = [IsLandlordOrAdmin]
    pagination_class = Pagination
    lookup_field = 'id'

    def get_queryset(self):
        return ChargeType.objects.filter(landlord=self.request.user, is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(landlord=self.request.user)

class ChargeViewSet(ModelViewSet):
    permission_classes = [IsLandlordOrAdmin]
    pagination_class = Pagination
    lookup_field = 'id'

    def get_queryset(self):
        queryset = Charge.objects.select_related(
            'tenancy', 'tenancy__unit', 'tenancy__unit__property'
        ).filter(tenancy__unit__property__owner=self.request.user)
    
        tenancy_id = self.request.query_params.get('tenancy')
        if tenancy_id:
            queryset = queryset.filter(tenancy_id=tenancy_id)
        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ChargeCreateSerializer
        return ChargeSerializer

    @action(detail=True, methods=['patch', 'put'], url_path='update-status')
    def update_status(self, request, id=None):
        charge = self.get_object()
        serializer = ChargeStatusUpdateSerializer(charge, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
 
        update_charge_status(charge, serializer.validated_data['status'])
 
        return Response(ChargeSerializer(charge).data)
    
    def perform_destroy(self, instance):
        if instance.status == 'paid':
            return Response({"detail": "Cannot delete a charge that has already been paid."}, status=status.HTTP_400_BAD_REQUEST)
        instance.delete()