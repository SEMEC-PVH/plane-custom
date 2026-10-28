# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import migrations


def profiles_to_pt_br(apps, schema_editor):
    """Existing profiles in English move to Portuguese, once; other languages are kept."""
    Profile = apps.get_model("db", "Profile")
    Profile.objects.filter(language="en").update(language="pt-BR")


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0122_alter_draftissue_assignees_alter_issue_assignees_and_more"),
        ("semec", "0002_projectactivity"),
    ]

    operations = [
        migrations.RunPython(profiles_to_pt_br, migrations.RunPython.noop),
    ]
