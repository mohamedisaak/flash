"""
One-time backfill: set ``order`` from a leading number in the category name.

Categories created with a numbered name (the 47 counties: "001 Mombasa" …
"047 Nairobi") but no explicit ``order`` all defaulted to ``order = 0`` and so
sorted alphabetically — which is wrong when the numbers aren't zero-padded
("10 …" before "2 …"). This sets ``order`` to the leading number so the model's
``(order, name)`` ordering lists them 1..47 in the nav and admin.

Only touches rows with ``order = 0`` and a leading number, so it never clobbers
an ordering an editor set deliberately. Idempotent and safe to re-run.
"""

import re

from django.db import migrations

_LEADING_NUMBER = re.compile(r"^\s*(\d+)")


def backfill_order(apps, schema_editor):
    Category = apps.get_model("categories", "Category")
    for cat in Category.objects.filter(order=0):
        match = _LEADING_NUMBER.match(cat.name or "")
        if match:
            cat.order = int(match.group(1))
            cat.save(update_fields=["order"])


class Migration(migrations.Migration):
    dependencies = [("categories", "0001_initial")]

    operations = [migrations.RunPython(backfill_order, migrations.RunPython.noop)]
