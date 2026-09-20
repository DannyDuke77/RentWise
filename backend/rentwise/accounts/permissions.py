from rest_framework.permissions import BasePermission
from rest_framework.exceptions import ValidationError


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

        return request.user.business_memberships.filter(
            business_id=business_id
        ).exists()