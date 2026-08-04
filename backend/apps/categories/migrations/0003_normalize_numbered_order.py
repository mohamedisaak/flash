"""
Normalize ``order`` to the leading number for every numbered category.

The first backfill (0002) only touched rows with ``order = 0``, so any county
that already had a stray non-zero order (e.g. "002 - Kwale" sitting at order 3)
was left wrong. For a numbered name the number *is* the intended order, so here
we set ``order`` to the leading number unconditionally for every category whose
name starts with one. Idempotent.
"""

import re

from django.db import migrations

_LEADING_NUMBER = re.compile(r"^\s*(\d+)")


def normalize_order(apps, schema_editor):
    Category = apps.get_model("categories", "Category")
    for cat in Category.objects.all():
        match = _LEADING_NUMBER.match(cat.name or "")
        if match:
            number = int(match.group(1))
            if cat.order != number:
                cat.order = number
                cat.save(update_fields=["order"])


class Migration(migrations.Migration):
    dependencies = [("categories", "0002_backfill_order_from_name")]

    operations = [migrations.RunPython(normalize_order, migrations.RunPython.noop)]
