"""
Serializers for the accounts app.

A **serializer** does two jobs: (1) turn model instances into JSON for
responses, and (2) validate incoming JSON and turn it into model data for
writes. Think of it as the translator between Python objects and the API's JSON.
See ``teaching/06-django-rest-framework/02-serializers.md``.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Public/self representation of a user. Never exposes the password."""

    full_name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "first_name",
            "last_name",
            "phone",
            "avatar",
            "bio",
            "social_links",
            "role",
            "status",
            "date_joined",
            "last_login",
        ]
        # These are set by the system/RBAC, not by the user editing their profile.
        read_only_fields = ["role", "status", "date_joined", "last_login"]


class RegisterSerializer(serializers.ModelSerializer):
    """Handles new sign-ups.

    ``password`` is write-only (never returned) and run through Django's password
    validators. New accounts always start as the ``subscriber`` role — you can't
    self-assign a newsroom role through the public API.
    """

    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "first_name", "last_name"]

    def create(self, validated_data):
        # create_user hashes the password correctly (never store it raw).
        return User.objects.create_user(**validated_data)
