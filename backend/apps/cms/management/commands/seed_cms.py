"""
Seed initial CMS content — static pages, FAQs, social links, and site settings.

Loads the ``initial_cms`` fixture, but **only on a fresh site**: if any static
page already exists we assume the CMS has been populated (and possibly edited in
the admin) and do nothing. That makes the command **idempotent** and safe to run
on every deploy — it seeds once, then quietly no-ops, so it never overwrites
content an editor changed in production.

Wired into Render's ``preDeployCommand`` (after ``migrate``) so a fresh
deployment comes up with the About/Contact/Terms/Privacy pages, the FAQ entries,
the footer's social links, and the site settings (contact address, about blurb)
already in place — the content authored locally, versioned as a fixture.

See ``teaching/40-news-aggregation/`` sibling patterns and Django's fixtures docs.
"""

from django.core.management import call_command
from django.core.management.base import BaseCommand

from apps.cms.models import StaticPage


class Command(BaseCommand):
    help = "Load initial CMS content (pages, FAQs, social links, settings) on a fresh site."

    def handle(self, *args, **options):
        if StaticPage.objects.exists():
            self.stdout.write("CMS already has static pages — skipping seed.")
            return
        call_command("loaddata", "initial_cms", verbosity=0)
        self.stdout.write(
            self.style.SUCCESS("Seeded initial CMS content (pages, FAQs, social links, settings).")
        )
