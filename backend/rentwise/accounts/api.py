from django.http import JsonResponse
from rest_framework.decorators import action
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework import status, generics
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import User, Business, BusinessMembership, BusinessInvitation
from .permissions import HasBusinessContext
from .serializers import BusinessSerializer, UserSettingsSerializer, BusinessInvitationSerializer, BusinessMembershipSerializer
from .services import (
    create_business,
    get_user_portal_access,
    create_business_invitation,
    accept_business_invitation,
    resend_business_invitation,
    change_business_member_role,
    remove_business_member,
    get_business_dashboard,
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
    
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_object(request):
    return Response({"detail": "object created"})

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "id": str(request.user.id),
            "name": request.user.name,
            "email": request.user.email,
            "portal_access": get_user_portal_access(request.user),
        })
    
class UserSettingsView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSettingsSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        return Response(
            {"success": True, "message": "Settings updated successfully"},
            status=status.HTTP_200_OK,
        )
    
class BusinessViewSet(ModelViewSet):
    serializer_class = BusinessSerializer
    lookup_field = "id"

    def get_permissions(self):
        if self.action in ["list", "create"]:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [HasBusinessContext]

        return [permission() for permission in permission_classes]

    def get_queryset(self):
        return Business.objects.filter(memberships__user=self.request.user).distinct()

    def perform_create(self, serializer):
        business = create_business(
            user=self.request.user, 
            **serializer.validated_data
        )

        serializer.instance = business

    def perform_update(self, serializer):
        business_id = self.request.headers.get("X-Business-ID")

        business = get_object_or_404(Business, id=business_id, memberships__user=self.request.user,)

        if not BusinessMembership.objects.filter(
            business=business,
            user=self.request.user,
            role="owner",
        ).exists():
            raise PermissionDenied("You do not have permission to perform this action.")

        serializer.save()

    @action(detail=True, methods=["get"], url_path="dashboard")
    def dashboard(self, request, id=None):
        business_id = request.headers.get("X-Business-ID")

        business = get_object_or_404(Business, id=business_id, memberships__user=request.user)
        return Response(
            get_business_dashboard(business),
            status=status.HTTP_200_OK,
        )
    
    @action(detail=False, methods=["get", "post"], url_path="invitations")
    def invitations(self, request, id=None):
        business_id = request.headers.get("X-Business-ID")

        business = get_object_or_404(Business, id=business_id, memberships__user=request.user)

        if request.method == "GET":
            invitations = BusinessInvitation.objects.filter(business=business, accepted_at__isnull=True, cancelled_at__isnull=True).order_by("-created_at")

            paginator = Pagination()
            page = paginator.paginate_queryset(invitations, request, view=self)
            if page is not None:
                serializer = BusinessInvitationSerializer(page, many=True)
                return paginator.get_paginated_response(serializer.data)

            serializer = BusinessInvitationSerializer(
                invitations,
                many=True,
            )

            return Response(serializer.data)

        if not BusinessMembership.objects.filter(
            business=business,
            user=request.user,
            role="owner",
        ).exists():
            raise PermissionDenied(
                "Only the business owner can send invitations."
            )

        serializer = BusinessInvitationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        invitation = create_business_invitation(
            business=business,
            email=serializer.validated_data["email"],
            role=serializer.validated_data.get("role", "staff"),
        )

        return Response(
            {
                "success": True,
                "message": "Invitation sent successfully.",
                "invitation": BusinessInvitationSerializer(invitation).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["delete"], url_path=r"invitations/(?P<invitation_id>[^/.]+)",)
    def cancel_invitation(self, request, id=None, invitation_id=None):
        business_id = request.headers.get("X-Business-ID")

        business = get_object_or_404(Business, id=business_id, memberships__user=request.user)

        if not BusinessMembership.objects.filter(business=business, user=request.user, role="owner").exists():
            raise PermissionDenied(
                "Only the business owner can cancel invitations."
            )

        invitation = get_object_or_404(BusinessInvitation, id=invitation_id, business=business,)

        if invitation.accepted_at:
            return Response({
                "detail": "This invitation has already been accepted."
                }, status=status.HTTP_400_BAD_REQUEST)

        if invitation.cancelled_at:
            return Response({
                "detail": "This invitation has already been cancelled."
            }, status=status.HTTP_400_BAD_REQUEST)

        invitation.cancelled_at = timezone.now()
        invitation.save(update_fields=["cancelled_at"])

        return Response({
            "success": True, 
            "message": "Invitation cancelled successfully."
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path=r"invitations/(?P<invitation_id>[^/.]+)/resend")
    def resend_invitation(self, request, id=None, invitation_id=None):
        business_id = request.headers.get("X-Business-ID")

        business = get_object_or_404(Business, id=business_id, memberships__user=request.user)

        if not BusinessMembership.objects.filter(business=business, user=request.user, role="owner",).exists():
            raise PermissionDenied(
                "Only the business owner can resend invitations."
            )

        invitation = get_object_or_404(BusinessInvitation, id=invitation_id, business=business)

        if invitation.is_accepted:
            return Response({
                "detail": "This invitation has already been accepted."
            }, status=status.HTTP_400_BAD_REQUEST)

        if invitation.is_cancelled:
            return Response({
                "detail": "This invitation has been cancelled."
            }, status=status.HTTP_400_BAD_REQUEST)

        invitation = resend_business_invitation(invitation)

        return Response(
            {
                "success": True,
                "message": "Invitation resent successfully.",
                "invitation": BusinessInvitationSerializer(invitation).data,
            }
        )

    @action(detail=False, methods=["get"], url_path="members")
    def members(self, request, id=None):
        business_id = request.headers.get("X-Business-ID")

        business = get_object_or_404(Business, id=business_id, memberships__user=request.user)

        memberships = (
            BusinessMembership.objects
            .filter(business=business)
            .select_related("user")
            .order_by("joined_at")
        )   

        paginator = Pagination()
        page = paginator.paginate_queryset(memberships, request, view=self)
        if page is not None:
            serializer = BusinessMembershipSerializer(page, many=True, context={"request": request})
            return paginator.get_paginated_response(serializer.data)


        serializer = BusinessMembershipSerializer(memberships, many=True, context={"request": request})

        return Response(serializer.data)

    @action(detail=False, methods=["patch", "delete"], url_path=r"members/(?P<membership_id>[^/.]+)")
    def manage_member(self, request, id=None, membership_id=None):
        business_id = request.headers.get("X-Business-ID")

        business = get_object_or_404(Business, id=business_id, memberships__user=request.user)

        if not BusinessMembership.objects.filter(business=business, user=request.user, role="owner").exists():
            raise PermissionDenied(
                "Only the business owner can manage members."
            )

        membership = get_object_or_404(BusinessMembership.objects.select_related("user"), id=membership_id, business=business)

        if request.method == "PATCH":
            role = request.data.get("role")

            try:
                membership = change_business_member_role(
                    membership=membership,
                    role=role,
                )
            except ValidationError as e:
                return Response(
                    {"detail": e.message_dict},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(
                BusinessMembershipSerializer(membership).data
            )

        if request.method == "DELETE":
            try:
                remove_business_member(
                    membership=membership,
                )
            except ValidationError as e:
                return Response(
                    {"detail": e.message_dict},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(
                {
                    "success": True,
                    "message": "Member removed successfully.",
                },
                status=status.HTTP_200_OK,
            )

class BusinessInvitationView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        invitation = get_object_or_404(BusinessInvitation.objects.select_related("business"), token=token,)

        if invitation.is_accepted:
            return Response(
                {"detail": "This invitation has already been accepted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if invitation.is_expired:
            return Response(
                {"detail": "This invitation has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email_has_account = User.objects.filter(
            email__iexact=invitation.email
        ).exists()

        return Response({
            "valid": True,
            "account_exists": email_has_account,
            "email": invitation.email,
            "role": invitation.role,
            "business": {
                "id": invitation.business.id,
                "company_name": invitation.business.company_name,
            },
        })

    def post(self, request, token):
        password = request.data.get("password")
        password_confirm = request.data.get("password_confirm")

        if not password:
            return Response(
                {"detail": "Password is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if password != password_confirm:
            return Response(
                {"detail": "Passwords do not match."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user, business = accept_business_invitation(
                token=token,
                password=password,
            )
        except ValidationError as e:
            return Response(
                {"detail": e.detail},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": True,
                "message": "Invitation accepted successfully. You can now log in.",
                "user_id": user.id,
                "business_id": business.id,
            },
            status=status.HTTP_201_CREATED,
        )