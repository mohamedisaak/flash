"""
Audit + provenance for AI synthesis.

Every synthesis attempt writes one :class:`SynthesisJob`. It records what went
in (which aggregated items, the editor's optional angle), which model produced
the output, how it went (status, timing, token counts, any error), and what came
out (a link to the draft :class:`~apps.articles.models.Article`).

Why persist this at all? Three reasons:

- **Provenance / trust** — we can always show which external reports a published
  piece was synthesised from. That transparency is the whole point of doing this
  the safe way.
- **Debugging** — when a model misbehaves, the stored prompt-side inputs and the
  error message make it reproducible.
- **Teaching** — it's a clean example of an async-job/audit table pattern.

The link to sources is a real M2M to :class:`AggregatedArticle`. Cross-app
relations (FK/M2M) are allowed and used elsewhere (aggregation → articles); the
rule we honour is "no cross-app model *imports at module scope for reuse*",
which we don't do — the relation is declared by string reference.

See ``teaching/41-ai-synthesis/project-files/models-explained.md``.
"""

from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class SynthesisStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    RUNNING = "running", "Running"
    SUCCESS = "success", "Success"
    ERROR = "error", "Error"


class SynthesisJob(TimeStampedModel):
    # --- Inputs ---
    sources = models.ManyToManyField(
        "aggregation.AggregatedArticle",
        related_name="synthesis_jobs",
        help_text="The aggregated items fed into this synthesis.",
    )
    angle = models.CharField(
        max_length=300,
        blank=True,
        help_text="Optional editorial steer for the framing of the piece.",
    )
    category_slug = models.CharField(
        max_length=80,
        blank=True,
        help_text="Editorial section the resulting draft is filed under.",
    )

    # --- Execution metadata ---
    status = models.CharField(
        max_length=12,
        choices=SynthesisStatus.choices,
        default=SynthesisStatus.PENDING,
        db_index=True,
    )
    provider = models.CharField(max_length=32, blank=True)
    model = models.CharField(max_length=120, blank=True)
    prompt_tokens = models.PositiveIntegerField(default=0)
    completion_tokens = models.PositiveIntegerField(default=0)
    duration_ms = models.PositiveIntegerField(default=0)
    error = models.TextField(blank=True)

    # --- Output ---
    article = models.ForeignKey(
        "articles.Article",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="synthesis_job",
        help_text="The draft article this job produced.",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="synthesis_jobs",
    )

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["status", "created_at"])]

    def __str__(self) -> str:
        return f"SynthesisJob #{self.pk} ({self.status})"
