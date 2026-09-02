from rest_framework.permissions import BasePermission


class IsLandlordOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.user_type in ['landlord', 'admin']
        )