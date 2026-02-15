from django.http import HttpResponse
from rest_framework.viewsets import ModelViewSet
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from django.shortcuts import get_object_or_404
from datetime import datetime
from django.utils import timezone
from decimal import Decimal
from django.db import transaction

from .serializers import PropertyDetailSerializer, UnitDetailSerializer, TenantSerializer, UnitRentStatusSerializer, PropertyRentSummarySerializer, UnitPaymentCreateSerializer, UnitPaymentSerializer, ChargeStatusUpdateSerializer, TenancyDropdownSerializer, ChargeSerializer, ChargeTypeSerializer, ChargeCreateSerializer
from .models import Property, Unit, Tenant, UnitPayment, Tenancy, ChangeLog, Charge, ChargeType

# Services
from .services.reports import get_property_audit_data, generate_property_audit_pdf
from .services.payment_service import process_payment
from .services.tenancy_service import add_tenant_to_unit, vacate_unit, add_roommate_to_unit, remove_roommate_from_unit
from .services.unit_service import update_unit

class Pagination(PageNumberPagination):
    page_size = 10  # default
    page_size_query_param = "page_size"
    max_page_size = 100
    
class PropertyViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PropertyDetailSerializer
    lookup_field = "id"

    def get_queryset(self):
        queryset = Property.objects.filter(owner=self.request.user)

        query = self.request.query_params.get("q")
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) | Q(location__icontains=query)
            )
        return queryset
    
    @action(detail=True, methods=['get'], url_path='rent-summary')
    def rent_summary(self, request, id=None):
        """
        Accessible at: GET /api/properties/<id>/rent-summary/
        """
        property_obj = self.get_object()
        serializer = PropertyRentSummarySerializer(property_obj)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='types')
    def property_types(self, request):
        """
        Accessible at: GET /api/properties/types/
        """
        return Response([
            {"value": value, "label": label}
            for value, label in Property.PROPERTY_TYPES
        ])
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "message": "Properties fetched successfully",
            "success": True,
            "properties": serializer.data, 
            "total_properties": queryset.count(),
        })
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['get'], url_path='audit-report')
    def audit_report(self, request, id=None):
        """
        Accessible at: GET /api/properties/<id>/audit-report/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
        """
        property_obj = self.get_object() # Automatically checks owner permissions
        
        try:
            # Extract and validate dates from query parameters
            start_date_str = request.query_params.get('start_date')
            end_date_str = request.query_params.get('end_date')
            
            if not start_date_str or not end_date_str:
                return HttpResponse("Start date and end date are required.", status=400)

            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return HttpResponse("Invalid date format. Use YYYY-MM-DD.", status=400)

        # Utilize your existing service functions
        audit_data = get_property_audit_data(property_obj, start_date, end_date)
        pdf_buffer = generate_property_audit_pdf(property_obj, audit_data, start_date, end_date)
        
        # Build the PDF response
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Position_{property_obj.name}.pdf"'
        return response
    
class UnitViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = UnitDetailSerializer
    lookup_field = "id"

    def get_queryset(self):
        queryset = Unit.objects.select_related("property").filter(
            property__owner=self.request.user
        )
        property_id = self.request.query_params.get("property")
        if property_id:
            queryset = queryset.filter(property_id=property_id)
        return queryset
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "message": "Units fetched successfully",
            "success": True,
            "units": serializer.data, 
            "total_units": queryset.count(),
        })

    def perform_create(self, serializer):
        property_id = self.request.data.get("property")
        property_obj = get_object_or_404(Property, id=property_id, owner=self.request.user)
        serializer.save(property=property_obj)

    def perform_update(self, serializer):
        unit = self.get_object()

        update_unit(unit, serializer, self.request.user)
        

    @action(detail=False, methods=['get'], url_path='rent-status')
    def rent_status(self, request):
        """
        Accessible at: GET /api/units/rent-status/
        """
        queryset = self.filter_queryset(self.get_queryset()).filter(is_active=True)
        serializer = UnitRentStatusSerializer(queryset, many=True)
        
        return Response({
            "success": True,
            "units_rent_status": serializer.data
        })
    
    @action(detail=True, methods=['get', 'post'], url_path='payments')
    def manage_payments(self, request, id=None):
        """
        GET: Returns balance, rent, charges, and payment history.
        POST: Records a new payment and updates tenancy balance.
        """
        unit = self.get_object()
        tenancy = unit.tenancies.filter(is_active=True).first()

        if not tenancy:
            return Response({
                "payments": [],
                "balance": 0.0,
                "monthly_rent": 0.0,
                "status": unit.status,
                "charges": 0.0,
                "charge_details": []
            }, status=200)

        if request.method == 'GET':
            current_balance = tenancy.calculate_balance()
            charges = tenancy.charges.filter(status="pending").order_by("-created_at")
            payments = tenancy.payments.all().order_by("-created_at")
            
            return Response({
                "payments": UnitPaymentCreateSerializer(payments, many=True).data,
                "balance": float(current_balance),
                "monthly_rent": float(tenancy.monthly_rent),
                "status": "arrears" if current_balance > 0 else "credit" if current_balance < 0 else "settled",
                "charges": float(sum([c.amount for c in charges])),
                "charge_details": ChargeSerializer(charges, many=True).data
            })

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
        
    @action(detail=True, methods=['post'], url_path='vacate')
    def vacate_unit(self, request, id=None):
        unit = self.get_object()

        vacate_unit(unit)

        return Response(
            {"detail": "Tenant moved out successfully"}, 
            status=status.HTTP_200_OK
        )
    
        
    @action(detail=True, methods=['post'], url_path='add-roommate')
    def add_roommate(self, request, id=None):
        unit = self.get_object()
        
        tenant = add_roommate_to_unit(unit, request.data)

        return Response({"detail": "Roommate added", "tenant_id": tenant.id}, status=201)

    @action(detail=True, methods=['post'], url_path='remove-roommate/(?P<tenant_id>[^/.]+)')
    def remove_roommate(self, request, id=None, tenant_id=None):
        """
        Accessible at: POST /api/units/<id>/remove-roommate/<tenant_id>/
        """
        unit = self.get_object()
        
        remove_roommate_from_unit(unit, tenant_id)

        return Response({"detail": "Roommate removed successfully"}, status=status.HTTP_200_OK)
    
class TenantViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TenantSerializer
    queryset = Tenant.objects.all()
    lookup_field = "id"

    def get_queryset(self):
        queryset = Tenant.objects.filter(
            tenancy_members__tenancy__unit__property__owner=self.request.user
        ).distinct()
    
        query = self.request.query_params.get("q")
        if query:
            queryset = queryset.filter(full_name__icontains=query)
            
        return queryset
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "message": "Tenants fetched successfully",
            "success": True,
            "tenants": serializer.data, 
            "total_tenants": queryset.count(),
        })
    
    @action(detail=False, methods=['get', 'post'], url_path='unit/(?P<unit_id>[^/.]+)')
    def unit_tenants(self, request, unit_id=None):
        """
        Accessible at: /api/tenants/unit/<unit_id>/ 
        """
        unit = get_object_or_404(Unit, id=unit_id)

        if request.method == 'GET':
            tenancy = Tenancy.objects.filter(unit=unit, is_active=True).first()
            if not tenancy:
                return Response({"tenancy_id": None, "tenants": []})
            
            serializer = TenantSerializer(tenancy.tenants.all(), many=True)
            return Response({
                "tenancy_id": tenancy.id,
                "tenants": serializer.data
            })

        if request.method == 'POST':
            
            tenancy, tenant = add_tenant_to_unit(unit, request.data)

            return Response({
                "success": True,
                "message": "Tenant added successfully",
                "tenancy_id": tenancy.id,
                "tenant_id": tenant.id
            }, status=201)
        
    
    @action(detail=False, methods=['get'], url_path='active-tenancies')
    def active_tenancies(self, request):
        """
        Accessible at: GET /api/tenants/active-tenancies/
        """
        queryset = Tenancy.objects.filter(
            is_active=True, 
            unit__property__owner=self.request.user
        ).select_related('unit', 'unit__property').order_by('-start_date')
        
        serializer = TenancyDropdownSerializer(queryset, many=True)
        return Response({
            "success": True,
            "tenancies": serializer.data
        })

    
class PaymentViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = UnitPaymentSerializer
    pagination_class = Pagination

    def get_queryset(self):
        """
        Filters payments to only show those belonging to the logged-in owner.
        """
        queryset = UnitPayment.objects.select_related(
            "tenancy", "tenancy__unit", "tenancy__unit__property"
        ).filter(tenancy__unit__property__owner=self.request.user)

        # Handle optional filtering via query params
        tenancy_id = self.request.query_params.get("tenancy_id")
        unit_id = self.request.query_params.get("unit_id")

        if tenancy_id:
            queryset = queryset.filter(tenancy_id=tenancy_id)
        elif unit_id:
            queryset = queryset.filter(tenancy__unit_id=unit_id)

        return queryset.order_by("-paid_on")

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return response
    
class ChargeTypeViewSet(ModelViewSet):
    serializer_class = ChargeTypeSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return ChargeType.objects.filter(landlord=self.request.user, is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(landlord=self.request.user)

class ChargeViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
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
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def perform_destroy(self, instance):
        if instance.status == 'paid':
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Cannot delete a charge that has already been paid.")
        instance.delete()