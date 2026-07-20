"""
User accounts and Role-Based Access Control (RBAC).

We replace Django's built-in ``auth.User`` with our own :class:`User` so we can
add newsroom-specific fields (phone, avatar, bio, social links, editorial role,
account status) without monkey-patching. ``AUTH_USER_MODEL = "accounts.User"``
in settings wires it in. This decision MUST be made before the first migration —
swapping the user model later is painful.

Roles are modelled as an enumeration on the user PLUS Django's Groups system:
- ``role`` gives a single primary title used for display and coarse checks.
- Django Groups/Permissions (set up in a later phase) carry the fine-grained
  "can publish", "can moderate comments" rules.

See ``teaching/11-authentication/`` and
``teaching/30-database-design/user-and-roles.md``.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    """The editorial hierarchy of a newsroom, from most to least privileged.

    ``TextChoices`` stores a short string in the DB (``value``) while giving a
    human label for admin/forms (the second argument). Using an enum keeps the
    allowed set in one place instead of scattering magic strings.
    """

    SUPER_ADMIN = "super_admin", "Super Admin"
    ADMIN = "admin", "Admin"
    EDITOR_IN_CHIEF = "editor_in_chief", "Editor in Chief"
    MANAGING_EDITOR = "managing_editor", "Managing Editor"
    SECTION_EDITOR = "section_editor", "Section Editor"
    JOURNALIST = "journalist", "Journalist"
    AUTHOR = "author", "Author"
    PHOTOGRAPHER = "photographer", "Photographer"
    VIDEO_EDITOR = "video_editor", "Video Editor"
    MODERATOR = "moderator", "Moderator"
    SUBSCRIBER = "subscriber", "Subscriber"


class UserStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    PENDING = "pending", "Pending verification"
    SUSPENDED = "suspended", "Suspended"
    BANNED = "banned", "Banned"


class User(AbstractUser):
    """The one canonical user for the whole platform.

    ``AbstractUser`` already provides: ``username``, ``email``, ``password``,
    ``first_name``, ``last_name``, ``is_staff``, ``is_active``, ``is_superuser``,
    ``last_login``, ``date_joined``. We add the newsroom-specific columns below.
    """

    # Contact / profile
    phone = models.CharField(max_length=32, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    bio = models.TextField(blank=True, help_text="Short author biography.")
    # Social links kept as a flexible JSON map, e.g. {"x": "...", "linkedin": "..."}
    social_links = models.JSONField(default=dict, blank=True)

    # Authorization / lifecycle
    role = models.CharField(
        max_length=32,
        choices=Role.choices,
        default=Role.SUBSCRIBER,
        db_index=True,
    )
    status = models.CharField(
        max_length=16,
        choices=UserStatus.choices,
        default=UserStatus.ACTIVE,
        db_index=True,
    )

    # Make email unique — we allow login by email OR username later.
    email = models.EmailField(unique=True)

    class Meta:
        db_table = "accounts_user"
        indexes = [
            models.Index(fields=["role", "status"]),
        ]

    def __str__(self) -> str:
        return self.get_full_name() or self.username

    # --- Convenience role helpers (coarse checks; fine-grained perms come later) ---
    @property
    def is_editorial_staff(self) -> bool:
        """True for anyone who can touch the newsroom, not just read it."""
        return self.role in {
            Role.SUPER_ADMIN,
            Role.ADMIN,
            Role.EDITOR_IN_CHIEF,
            Role.MANAGING_EDITOR,
            Role.SECTION_EDITOR,
            Role.JOURNALIST,
            Role.AUTHOR,
            Role.PHOTOGRAPHER,
            Role.VIDEO_EDITOR,
            Role.MODERATOR,
        }

    @property
    def can_publish(self) -> bool:
        """Only editors and admins push content live; authors submit for review."""
        return self.role in {
            Role.SUPER_ADMIN,
            Role.ADMIN,
            Role.EDITOR_IN_CHIEF,
            Role.MANAGING_EDITOR,
            Role.SECTION_EDITOR,
        }
