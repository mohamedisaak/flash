"""
Serializers for photo galleries.

Demonstrates **nested writable-ish serializers**: a gallery's images are read as
a nested list. Image *uploads* are handled through the dedicated image endpoint
(kept simple here); the gallery serializer focuses on the container + reading its
images. See ``teaching/06-django-rest-framework/02-serializers.md``.
"""

from rest_framework import serializers

from apps.categories.models import Category

from .models import GalleryImage, PhotoGallery


class GalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryImage
        fields = ["id", "gallery", "image", "caption", "credit", "order"]


class PhotoGallerySerializer(serializers.ModelSerializer):
    images = GalleryImageSerializer(many=True, read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category", queryset=Category.objects.all(), write_only=True
    )

    class Meta:
        model = PhotoGallery
        fields = [
            "id", "title", "slug", "description", "category", "category_id",
            "images", "published_at", "created_at",
        ]
        read_only_fields = ["slug", "category", "created_at"]
