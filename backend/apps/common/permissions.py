"""
Reusable DRF permission classes — the "authorization" layer of the API.

A permission class answers one yes/no question per request: *is this caller
allowed to do this?* DRF calls ``has_permission`` (view-level) and
``has_object_permission`` (row-level) for us. These build on the ``role`` and
helper properties defined on the custom user model
(``apps/accounts/models.py``).

See ``teaching/11-authentication/02-jwt-and-drf-permissions.md``.
"""

from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAuthenticatedOrReadOnly(BasePermission):
    """Anyone may read (GET/HEAD/OPTIONS); only logged-in users may write.

    Used for public content that registered users can interact with.
    """

    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)


class IsEditorialStaff(BasePermission):
    """Only newsroom staff (any editorial role) may access the view at all."""

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.is_editorial_staff)


class ReadOnlyOrEditorialStaff(BasePermission):
    """Public/authenticated reads; writes require editorial staff.

    Perfect for content endpoints: readers GET articles, but creating or editing
    one requires a newsroom account.
    """

    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        return bool(user and user.is_authenticated and user.is_editorial_staff)


class IsAuthorOrEditorOrReadOnly(BasePermission):
    """Row-level rule for articles.

    Reads are open. Writing at all requires an editorial-staff account (so
    ordinary subscribers can't create content). The object-level check then
    narrows *editing an existing article* to its author, its assigned editor, or
    someone who can publish.
    """

    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        return bool(user and user.is_authenticated and user.is_editorial_staff)

    def has_object_permission(self, request, view, obj) -> bool:
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (
                getattr(obj, "author_id", None) == user.id
                or getattr(obj, "editor_id", None) == user.id
                or user.can_publish
            )
        )


class IsOwnerOrReadOnly(BasePermission):
    """Row-level rule for user-owned objects (comments, bookmarks, etc.).

    The object must expose an ``author``/``recipient``/``user`` FK; only that
    owner may modify it. Moderators/admins bypass via ``can_publish`` /
    ``is_editorial_staff`` where those views opt in.
    """

    owner_fields = ("author_id", "user_id", "recipient_id")

    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj) -> bool:
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        if not (user and user.is_authenticated):
            return False
        for field in self.owner_fields:
            if hasattr(obj, field):
                return getattr(obj, field) == user.id
        return False
