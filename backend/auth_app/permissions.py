from rest_framework.permissions import BasePermission
from rest_framework import permissions

from auth_app.models import User

class IsSystemAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.SYSTEM_ADMIN
    
class IsTransportManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.TRANSPORT_MANAGER
class IsDepartmentManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.DEPARTMENT_MANAGER
class IsCeo(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.CEO
class IsGeneralSystem(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.GENERAL_SYSTEM
class ReadOnlyOrAuthenticated(BasePermission):
 
    def has_permission(self, request, view):
        # Allow GET, HEAD, and OPTIONS requests for everyone
        if request.method in permissions.SAFE_METHODS:
            return True
        # Require authentication for other requests
        return request.user and request.user.is_authenticated
class IsNotDriverOrAdminOrEmployee(permissions.BasePermission):
    """
    Custom permission to only allow users who are not drivers, system admins, or employees.
    """
    def has_permission(self, request, view):
        user = request.user
        return user.role not in [User.DRIVER, User.SYSTEM_ADMIN, User.EMPLOYEE]