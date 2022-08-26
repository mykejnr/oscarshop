from apps.core.permissions import AuthOwnerPermission


class OrderViewPermission(AuthOwnerPermission):
    def has_permission(self, request, view):
        if view.action == 'anonymous':
            return True
        return request.user.is_authenticated