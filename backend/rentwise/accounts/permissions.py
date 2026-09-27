from rest_framework.permissions import BasePermission
from rest_framework.exceptions import ValidationError

from .models import BusinessMembership, Business

class IsBusinessMember(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.business_memberships.exists()
        )

class HasBusinessContext(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        business_id = request.headers.get("X-Business-ID")

        if not business_id:
            raise ValidationError({
                "business": "Business context is required."
            })

        membership = request.user.business_memberships.filter(
            business_id=business_id,
        ).first()

        if not membership:
            raise ValidationError({
                "business": "You do not have access to this business."
            })

        request.business = membership.business

        return True

class IsBusinessManagerOrOwner(BasePermission):
    message = "Only the business owner or manager can perform this action."

    def has_permission(self, request, view):
        business = getattr(request, "business", None)

        if not business:
            return False

        return BusinessMembership.objects.filter(
            business=business,
            user=request.user,
            role__in=["owner", "manager"],
        ).exists()
        