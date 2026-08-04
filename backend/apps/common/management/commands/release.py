"""
The deploy "release" step: apply migrations, then seed initial content.

Render's ``preDeployCommand`` runs a **single** command and does **not** go
through a shell, so chaining with ``&&`` doesn't work (the extra tokens get
passed as arguments to the first command and it errors out). So instead of
``migrate && seed_cms`` in the YAML, we orchestrate both steps here and point
preDeploy at this one command.

Ordering matters: ``migrate`` first (bring the schema up to date), then
``seed_cms`` (load data into that schema). ``seed_cms`` is itself idempotent and
non-fatal, so re-running a deploy is always safe.

See ``teaching/41-ai-synthesis/`` sibling command patterns and
``apps/cms/management/commands/seed_cms.py``.
"""

from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Deploy release step: run migrations, then seed initial CMS content."

    def handle(self, *args, **options):
        self.stdout.write("release: applying migrations…")
        call_command("migrate", interactive=False)
        self.stdout.write("release: seeding CMS content…")
        call_command("seed_cms")
        self.stdout.write(self.style.SUCCESS("release: done."))
