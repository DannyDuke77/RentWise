from django.http import HttpResponse
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Q, Prefetch, Sum, Count
from django.shortcuts import get_object_or_404
from datetime import datetime

from .serializers import (
    PropertySerializer, UnitDetailSerializer, TenantSerializer, 
    UnitPaymentCreateSerializer, UnitPaymentSerializer, ChargeStatusUpdateSerializer, ChangeLogSerializer,
    ChargeSerializer, ChargeListSerializer, ChargeTypeSerializer, ChargeCreateSerializer
)
from .models import Property, TenantInvitation, Unit, Tenant, UnitPayment, Tenancy, Charge, ChargeType, TenancyMember, ChangeLog

from accounts.permissions import IsBusinessMember, HasBusinessContext
from accounts.models import Business

# Services
from .services.reports import get_property_audit_data, generate_property_audit_pdf
from .services.payment_service import process_payment, get_payment_analytics
from .services.charge_service import update_charge_status
from .services.tenancy_service import accept_tenant_invitation, vacate_unit, add_tenant_or_roommate_to_unit, remove_roommate_from_unit
from .services.unit_service import update_unit
from .services.rent import get_property_dashboard, get_property_units
from .services.export import stream_payments_csv

@action(detail=False, methods=["get"], url_path="export")
def export(self, request):
    queryset = self.get_queryset()
    fmt = request.query_params.get("format", "csv")

    if fmt == "csv":
        return stream_payments_csv(queryset, filename_prefix="payments")
    return Response(
        {"detail": f"Unsupported format: {fmt}"},
        status=status.HTTP_400_BAD_REQUEST,
    )

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
        }, status=status.HTTP_200_OK)
    
class PropertyViewSet(ModelViewSet):
    permission_classes = [HasBusinessContext]
    serializer_class = PropertySerializer
    pagination_class = Pagination
    lookup_field = "id"

    def get_queryset(self):
        business_id = self.request.headers.get("X-Business-ID")
        
        queryset = Property.objects.filter(
            business_id=business_id,
            business__memberships__user=self.request.user, 
            is_active=True,
        ).order_by("created_at")

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(location__icontains=search)
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
        business_id = self.request.headers.get("X-Business-ID")

        business = get_object_or_404(Business, id=business_id, memberships__user=self.request.user,)

        serializer.save(business=business)

    def perform_update(self, serializer):
        property = self.get_object()

        if serializer.validated_data.get("is_active") is False:
            if property.units.filter(
                is_active=True,
                status="occupied"
            ).exists():
                occupied_count = property.units.filter(
                    is_active=True,
                    status="occupied"
                ).count()

                raise ValidationError({
                    "property": (
                        f"{occupied_count} "
                        f"{'unit is' if occupied_count == 1 else 'units are'} "
                        "currently occupied. "
                        "Please terminate the active tenancies before deactivating this property."
                    )
                })

        serializer.save()

    @action(detail=True, methods=["get"])
    def units(self, request, id=None):
        property_obj = self.get_object()
        
        search = request.query_params.get("search")
        status = request.query_params.get("status")
        rent_status = request.query_params.get("rent_status")
        data = get_property_units(property_obj.id, search=search, status=status, rent_status=rent_status)
        
        page = self.paginate_queryset(data)
        if page is not None:
            return self.get_paginated_response(page)
        
        return Response(data)
    
    @action(detail=True, methods=['get'], url_path='rent-summary')
    def rent_summary(self, request, id=None):
        property_obj = self.get_object()
        dashboard_data = get_property_dashboard(property_obj.id)
        return Response({
            "id": dashboard_data["property"]["id"],
            "name": dashboard_data["property"]["name"],
            "summary": dashboard_data["summary"]
        })

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

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        queryset = self.get_queryset()

        total_properties = queryset.count()

        unit_stats = Unit.objects.filter(
            property__in=queryset,
            is_active=True,
        ).aggregate(
            total_units=Count('id'),
            total_occupied=Count('id', filter=Q(status='occupied')),
            total_vacant=Count('id', filter=Q(status='vacant')),
            total_maintenance=Count('id', filter=Q(status='maintenance')),
        )

        total_units = unit_stats['total_units'] or 0
        total_occupied = unit_stats['total_occupied'] or 0
        total_vacant = unit_stats['total_vacant'] or 0
        total_maintenance = unit_stats['total_maintenance'] or 0
        occupancy_rate = (total_occupied / total_units * 100) if total_units else 0

        return Response({
            "total_properties": total_properties,
            "total_units": total_units,
            "total_occupied": total_occupied,
            "total_vacant": total_vacant,
            "total_maintenance": total_maintenance,
            "occupancy_rate": occupancy_rate,
        })
    
class UnitViewSet(ModelViewSet):
    permission_classes = [IsBusinessMember]
    serializer_class = UnitDetailSerializer
    pagination_class = Pagination
    lookup_field = "id"

    def get_queryset(self):
        queryset = Unit.objects.select_related("property").filter(property__business__memberships__user=self.request.user)
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
        property_obj = get_object_or_404(Property, id=property_id, business__memberships__user=self.request.user)
        serializer.save(property=property_obj)

    def perform_update(self, serializer):
        unit = self.get_object()
        update_unit(unit, serializer, self.request.user)

    @action(detail=False, methods=['get'], url_path='rent-status')
    def rent_status(self, request):
        property_id = request.query_params.get("property")
        if property_id:
            get_object_or_404(Property, id=property_id, business__memberships__user=request.user)
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
        }, status=status.HTTP_400_BAD_REQUEST)
    
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
            })

        if request.method == 'GET':
            payments = tenancy.payments.all().order_by("-created_at")

            search = request.query_params.get("search")
            payment_method = request.query_params.get("payment_method")
            filter_date = request.query_params.get("filter_date")
            
            if search:
                payments = payments.filter(
                    Q(reference__icontains=search) |
                    Q(payment_method__icontains=search) |
                    Q(notes__icontains=search) |
                    Q(amount_paid__icontains=search)
                )
            
            if payment_method:
                payments = payments.filter(payment_method=payment_method)
            
            if filter_date:
                payments = payments.filter(paid_on__date=filter_date)
            
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
                "charge_details": ChargeListSerializer(charges, many=True).data
            })

            return paginator.get_paginated_response(response_data)

        if request.method in ['POST']:
            serializer = UnitPaymentCreateSerializer(payment, data=request.data, partial=(request.method == 'PATCH'))
            serializer.is_valid(raise_exception=True)

            new_balance = process_payment(tenancy, serializer.validated_data)

            return Response({
                "success": True,
                "balance": float(new_balance),
            }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='change-logs')
    def change_logs(self, request, id=None):
        unit = self.get_object()

        queryset = ChangeLog.objects.filter(
            unit=unit
        ).select_related(
            'changed_by',
            'unit',
            'unit__property'
        ).order_by('-created_at')

        field_name = self.request.query_params.get('field_name')
        if field_name:
            queryset = queryset.filter(field_name=field_name)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(changed_by__name__icontains=search) |
                Q(field_name__icontains=search) |
                Q(old_value__icontains=search) |
                Q(new_value__icontains=search)
            )

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = ChangeLogSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ChangeLogSerializer(queryset, many=True)
        return Response(serializer.data)
        
class TenantViewSet(ModelViewSet):
    permission_classes = [IsBusinessMember]
    serializer_class = TenantSerializer
    pagination_class = Pagination
    queryset = Tenant.objects.all()
    lookup_field = "id"

    def get_permissions(self):
        if self.action in ['invitation', 'accept_invitation']:
            return [AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        business_id = self.request.headers.get("X-Business-ID")

        if not Business.objects.filter(
            id=business_id,
            memberships__user=self.request.user,
        ).exists():
            return Tenant.objects.none()

        queryset = Tenant.objects.filter(
            tenancy_members__tenancy__unit__property__business_id=business_id,
        ).distinct()

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search)
            ) 

        status = self.request.query_params.get("status")
        if status:
            queryset = queryset.filter(is_active=status)
        
        if self.action in ['list', 'retrieve', 'unit_tenants']:
            queryset = queryset.prefetch_related(
                Prefetch(
                    'tenancy_members',
                    queryset=TenancyMember.objects.select_related(
                        'tenancy__unit', 
                        'tenancy__unit__property',
                        'tenancy__unit__property__business'
                    )
                )
            )
            
        query = self.request.query_params.get("q")
        if query:
            queryset = queryset.filter(full_name__icontains=query)
        return queryset

    @action(detail=False, methods=['get', 'post'], url_path='unit/(?P<unit_id>[^/.]+)')
    def unit_tenants(self, request, unit_id=None):
        unit = get_object_or_404(Unit, id=unit_id, property__business__memberships__user=request.user)

        if request.method == 'GET':
            tenancy = Tenancy.objects.filter(unit=unit, is_active=True).first()
            if not tenancy:
                return Response({"tenancy_id": None, "tenants": []})
            
            active_members = TenancyMember.objects.filter(tenancy=tenancy, is_active=True).select_related('tenant')

            serializer = TenantSerializer([member.tenant for member in active_members], many=True)
            return Response({
                "tenancy_id": tenancy.id,
                "tenants": serializer.data
            }, status=status.HTTP_200_OK)

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
            }, status=status.HTTP_201_CREATED)

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
        unit = get_object_or_404(Unit, id=unit_id, property__business__memberships__user=request.user)
        vacate_unit(unit)
        return Response(
            {"success": True, "message": "Unit vacated successfully"}, 
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'], url_path='unit/(?P<unit_id>[^/.]+)/remove-roommate/(?P<tenant_id>[^/.]+)')
    def remove_roommate(self, request, unit_id=None, tenant_id=None):
        unit = get_object_or_404(Unit, id=unit_id, property__business__memberships__user=request.user)
        remove_roommate_from_unit(unit, tenant_id)
        return Response(
            {"success": True, "message": "Roommate removed successfully"}, 
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        queryset = self.get_queryset()

        total_tenants = queryset.count()
        total_active_tenants = queryset.filter(
            tenancy_members__is_active=True
        ).count()
        total_inactive_tenants = queryset.filter(
            tenancy_members__is_active=False
        ).count()

        return Response({
            "total_tenants": total_tenants,
            "total_active_tenants": total_active_tenants,
            "total_inactive_tenants": total_inactive_tenants
        })

class TenantMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = get_object_or_404(Tenant.objects.select_related("user"), user=request.user,)

        tenancies = (
            Tenancy.objects
            .filter(
                tenancy_members__tenant=tenant,
                tenancy_members__is_active=True,
                is_active=True,
            )
            .select_related("unit", "unit__property")
        )

        return Response({
            "id": str(tenant.id),
            "full_name": tenant.full_name,
            "email": tenant.email,
            "phone": tenant.phone,
            "tenancies": [
                {
                    "id": str(tenancy.id),
                    "unit": tenancy.unit.name,
                    "property": tenancy.unit.property.name,
                    "monthly_rent": str(tenancy.monthly_rent),
                    "balance": str(tenancy.calculate_balance()),
                    "deposit_held": str(tenancy.get_deposit_held()),
                    "start_date": tenancy.start_date,
                    "billing_start_date": tenancy.billing_start_date,
                }
                for tenancy in tenancies
            ],
        })

class PaymentViewSet(ModelViewSet):
    permission_classes = [HasBusinessContext]
    pagination_class = Pagination
    lookup_field = 'id'
    serializer_class = UnitPaymentSerializer

    def get_queryset(self):
        business_id = self.request.headers.get("X-Business-ID")
        
        queryset = UnitPayment.objects.select_related(
            "tenancy", "tenancy__unit", "tenancy__unit__property"
        ).filter(
            tenancy__unit__property__business_id=business_id,
            tenancy__unit__property__business__memberships__user=self.request.user
        )

        tenancy_id = self.request.query_params.get("tenancy_id")
        unit_id = self.request.query_params.get("unit_id")

        search = self.request.query_params.get("search")
        payment_method = self.request.query_params.get("payment_method")
        filter_type = self.request.query_params.get("filter_type")
        filter_date = self.request.query_params.get("filter_date")

        if tenancy_id:
            queryset = queryset.filter(tenancy_id=tenancy_id)
        elif unit_id:
            queryset = queryset.filter(tenancy__unit_id=unit_id)

        if search:
            queryset = queryset.filter(
                Q(reference__icontains=search) |
                Q(payment_method__icontains=search) |
                Q(type__icontains=search) |
                Q(notes__icontains=search) |
                Q(tenancy__unit__property__name__icontains=search) |
                Q(tenancy__unit__name__icontains=search)
            )

        if filter_type:
            queryset = queryset.filter(type=filter_type)

        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        
        if filter_date:
            queryset = queryset.filter(paid_on__date=filter_date)


        return queryset.order_by("-paid_on", "-created_at")
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return UnitPaymentCreateSerializer
        return UnitPaymentSerializer

    def create(self, request, *args, **kwargs):
        tenancy_id = request.data.get("tenancy_id")
        if not tenancy_id:
            return Response({
                "success": False,
                "errors": {"tenancy_id": ["This field is required."]}
            }, status=status.HTTP_400_BAD_REQUEST)

        tenancy = get_object_or_404(
            Tenancy, 
            id=tenancy_id, 
            unit__property__business__memberships__user=self.request.user
        )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        payment, new_balance = process_payment(tenancy, serializer.validated_data)

        return Response({
            "success": True,
            "id": str(payment.id),
            "balance": float(new_balance),
            "payment": UnitPaymentSerializer(payment).data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        payment = self.get_object()

        if payment.source == "stk":
            return Response({
                "success": False,
                "errors": {
                    "detail": "M-Pesa STK payments cannot be edited. Delete and re-record instead."
                },
            }, status=status.HTTP_400_BAD_REQUEST)
        tenancy = payment.tenancy
        
        serializer = self.get_serializer(payment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_payment = serializer.save()
        
        new_balance = tenancy.calculate_balance()
        
        return Response({
            "success": True,
            "id": str(updated_payment.id),
            "balance": float(new_balance),
            "payment": self.get_serializer(updated_payment).data
        }, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        payment = self.get_object()

        if payment.source == "stk":
            return Response({
                "success": False,
                "errors": {
                    "detail": "M-Pesa STK payments cannot be deleted. Record an offsetting refund instead."
                },
            })
        
        tenancy = payment.tenancy
        payment.delete()
        
        new_balance = tenancy.calculate_balance()
        
        return Response({
            "success": True,
            "message": "Payment deleted successfully",
            "balance": float(new_balance)
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="analytics")
    def analytics(self, request):
        return Response(get_payment_analytics(request.user))

    @action(detail=False,methods=["get"],url_path="property/(?P<property_id>[^/.]+)/analytics")
    def property_analytics(self, request, property_id=None):
        get_object_or_404(Property, id=property_id, business__memberships__user=self.request.user)
        return Response(get_payment_analytics(request.user, property_id=property_id))

    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request):
        queryset = self.get_queryset()
        fmt = request.query_params.get("export_format", "csv")

        if fmt == "csv":
            return stream_payments_csv(queryset, filename_prefix=f"payments")
        return Response(
            {"detail": f"Unsupported format: {fmt}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

class TenantPaymentsView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UnitPaymentSerializer
    pagination_class = Pagination

    def get_queryset(self):
        return (
            UnitPayment.objects
            .select_related(
                "tenancy",
                "tenancy__unit",
                "tenancy__unit__property",
            )
            .filter(
                tenancy__tenancy_members__tenant__user=self.request.user,
                tenancy__tenancy_members__is_active=True,
                tenancy__is_active=True,
            )
            .order_by("-paid_on", "-created_at")
        )
    
class ChargeTypeViewSet(ModelViewSet):
    serializer_class = ChargeTypeSerializer
    permission_classes = [HasBusinessContext]
    pagination_class = Pagination
    lookup_field = 'id'

    def get_queryset(self):
        business_id = self.request.headers.get("X-Business-ID")

        queryset = ChargeType.objects.filter(
            business_id=business_id, 
            business__memberships__user=self.request.user
        )

        search = self.request.query_params.get("search")
        is_active = self.request.query_params.get("is_active")

        if search:
            queryset = queryset.filter(name__icontains=search)

        if is_active:
            queryset = queryset.filter(is_active=is_active)

        return queryset.order_by("name", "-is_active")
    
    def perform_create(self, serializer):
        business_id = self.request.headers.get("X-Business-ID")

        business = get_object_or_404(
            Business,
            id=business_id,
            memberships__user=self.request.user,
        )

        serializer.save(business=business)

class ChargeViewSet(ModelViewSet):
    permission_classes = [HasBusinessContext]
    pagination_class = Pagination
    lookup_field = 'id'

    def get_queryset(self):
        business_id = self.request.headers.get("X-Business-ID")

        queryset = Charge.objects.select_related(
            'tenancy', 'tenancy__unit', 'tenancy__unit__property'
        ).filter(
            tenancy__unit__property__business_id=business_id,
            tenancy__unit__property__business__memberships__user=self.request.user
        )
    
        tenancy_id = self.request.query_params.get('tenancy')
        unit_id = self.request.query_params.get('unit_id')
        property_id = self.request.query_params.get('property_id')
        status_filter = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        
        if tenancy_id:
            queryset = queryset.filter(tenancy_id=tenancy_id)
        if unit_id:
            queryset = queryset.filter(tenancy__unit_id=unit_id)
        if property_id:
            queryset = queryset.filter(tenancy__unit__property_id=property_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if search:
            queryset = queryset.filter(
                Q(charge_type__name__icontains=search) |
                Q(description__icontains=search) |
                Q(tenancy__unit__name__icontains=search) |
                Q(tenancy__unit__property__name__icontains=search)
            )
        
        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ChargeCreateSerializer
        return ChargeSerializer

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Get charge statistics"""
        queryset = self.get_queryset()
        
        total_charges = queryset.count()
        total_amount = queryset.aggregate(total=Sum('amount'))['total'] or 0
        pending = queryset.filter(status='pending').count()
        paid = queryset.filter(status='paid').count()
        waived = queryset.filter(status='waived').count()
        
        return Response({
            "total_charges": total_charges,
            "total_amount": float(total_amount),
            "pending": pending,
            "paid": paid,
            "waived": waived
        })

    @action(detail=True, methods=['patch', 'put'], url_path='update-status')
    def update_status(self, request, id=None):
        charge = self.get_object()
        serializer = ChargeStatusUpdateSerializer(charge, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
 
        update_charge_status(charge, serializer.validated_data['status'])
 
        return Response(ChargeSerializer(charge).data)
    
    def destroy(self, request, *args, **kwargs):
        charge = self.get_object()
        
        if charge.status == 'paid':
            return Response({
                "success": False,
                "errors": {"status": ["Cannot delete a charge that has already been paid."]}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        charge.delete()
        
        return Response({
            "success": True,
            "message": "Charge deleted successfully"
        }, status=status.HTTP_200_OK)

class ChangeLogViewSet(ReadOnlyModelViewSet):
    permission_classes = [HasBusinessContext]
    serializer_class = ChangeLogSerializer
    pagination_class = Pagination
    lookup_field = 'id'

    def get_queryset(self):
        queryset = ChangeLog.objects.filter(
            unit__property__business__memberships__user=self.request.user
        ).select_related('changed_by', 'unit', 'unit__property')
        
        field_name = self.request.query_params.get('field_name')
        if field_name:
            queryset = queryset.filter(field_name=field_name)
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(changed_by__name__icontains=search) |
                Q(field_name__icontains=search) |
                Q(old_value__icontains=search) |
                Q(new_value__icontains=search)
            )
        
        return queryset.order_by('-created_at')