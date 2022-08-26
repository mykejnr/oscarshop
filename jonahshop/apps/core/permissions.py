from rest_framework import permissions


class AuthOwnerPermission(permissions.BasePermission):
    """
    Provide a default implementation of has_permission and
    'has_object_permission',
    """

    def has_permission(self, request, view):
        """
        returns true is user is authenticated
        """
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """
        returns true if request.user is the owner of object
        """
        return obj.user == request.user
