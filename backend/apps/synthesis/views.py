"""
AI-synthesis admin API (staff only).

Two things editors need: to know whether synthesis is *ready* (which provider,
which model, is it reachable), and to *run* it over selected aggregated items.

Routes (mounted under ``/api/v1/synthesis/``)::

    GET  status/            provider/model + enabled flag (for the admin banner)
    GET  jobs/              synthesis history (also DELETE jobs/{id}/)
    POST jobs/run/          {ids, angle, category} -> create a draft, return the job

Synthesis runs **synchronously** here (like the ingestion ``run`` endpoint) so a
single-VPS deployment works without a running Celery worker, and the editor gets
the draft link back immediately. A Celery task exists in ``tasks.py`` for
newsrooms that prefer to offload it.

See ``teaching/41-ai-synthesis/project-files/views-explained.md``.
"""

from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsEditorialStaff

from . import services
from .models import SynthesisJob
from .providers import LLMError, provider_status
from .serializers import SynthesisJobSerializer


class SynthesisStatusView(APIView):
    """Report whether synthesis is configured and which model would run."""

    permission_classes = [IsEditorialStaff]

    def get(self, request):
        return Response(provider_status())


class SynthesisJobViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    queryset = SynthesisJob.objects.select_related("article").prefetch_related("sources")
    serializer_class = SynthesisJobSerializer
    permission_classes = [IsEditorialStaff]

    @action(detail=False, methods=["post"])
    def run(self, request):
        """Synthesise one draft article from the selected aggregated item ids."""
        data = request.data or {}
        ids = data.get("ids") or []
        if not isinstance(ids, list) or not ids:
            return Response(
                {"detail": "Provide a non-empty 'ids' list."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            ids = [int(i) for i in ids]
        except (TypeError, ValueError):
            return Response(
                {"detail": "'ids' must be integers."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            job = services.synthesize(
                ids,
                request.user,
                angle=str(data.get("angle", ""))[:300],
                category_slug=data.get("category"),
            )
        except (services.SynthesisError, LLMError) as exc:
            # A model/prompt failure is a client-actionable 422, not a 500.
            return Response({"detail": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        return Response(SynthesisJobSerializer(job).data, status=status.HTTP_201_CREATED)
