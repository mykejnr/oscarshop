from rest_framework import permissions


class OrderViewPermission(permissions.BasePermission):

    def has_permission(self, request, view):
        if view.action == 'anonymous':
            return True
        return request.user.is_authenticated

    
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user