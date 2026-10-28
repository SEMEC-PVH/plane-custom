# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Record project activity from model saves, without touching Plane's views.

Members joining or leaving are not recorded: Plane adds them with bulk_create/bulk_update,
which do not send signals.
"""

# Third party imports
from crum import get_current_user

# Django imports
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

# Module imports
from plane.db.models import Module, Project
from plane.semec.models import ProjectActivity, ProjectProperties

PROPERTY_FIELDS = ("status", "priority", "start_date", "target_date")
PROPERTY_DEFAULTS = {"status": "backlog", "priority": "none", "start_date": None, "target_date": None}


def _as_text(value):
    if value is None:
        return None
    return value.isoformat() if hasattr(value, "isoformat") else str(value)


def _actor_id():
    user = get_current_user()
    return user.id if user is not None and user.is_authenticated else None


def _record(project_id, verb, field, old_value=None, new_value=None, module_id=None):
    project = Project.all_objects.filter(pk=project_id).first()
    if project is None:
        return
    ProjectActivity.objects.create(
        project=project,
        actor_id=_actor_id(),
        verb=verb,
        field=field,
        old_value=_as_text(old_value),
        new_value=_as_text(new_value),
        module_id=module_id,
    )


def _remember_previous(sender, instance, fields):
    previous = None
    if instance.pk:
        previous = sender._base_manager.filter(pk=instance.pk).values(*fields).first()
    instance._semec_previous = previous


@receiver(pre_save, sender=Module)
def remember_module(sender, instance, **kwargs):
    _remember_previous(sender, instance, ("name", "target_date", "deleted_at"))


@receiver(post_save, sender=Module)
def record_module(sender, instance, created, **kwargs):
    previous = getattr(instance, "_semec_previous", None)
    if created or previous is None:
        _record(instance.project_id, "created", "milestone", new_value=instance.name, module_id=instance.id)
        return
    if previous["deleted_at"] is None and instance.deleted_at is not None:
        _record(instance.project_id, "deleted", "milestone", old_value=instance.name, module_id=instance.id)
        return
    if previous["name"] != instance.name:
        _record(
            instance.project_id, "updated", "milestone.name", previous["name"], instance.name, module_id=instance.id
        )
    if previous["target_date"] != instance.target_date:
        _record(
            instance.project_id,
            "updated",
            "milestone.target_date",
            previous["target_date"],
            instance.target_date,
            module_id=instance.id,
        )


@receiver(pre_save, sender=ProjectProperties)
def remember_properties(sender, instance, **kwargs):
    _remember_previous(sender, instance, PROPERTY_FIELDS)


@receiver(post_save, sender=ProjectProperties)
def record_properties(sender, instance, **kwargs):
    previous = getattr(instance, "_semec_previous", None) or PROPERTY_DEFAULTS
    for field in PROPERTY_FIELDS:
        new_value = getattr(instance, field)
        if previous[field] != new_value:
            _record(instance.project_id, "updated", field, previous[field], new_value)


@receiver(pre_save, sender=Project)
def remember_project(sender, instance, **kwargs):
    _remember_previous(sender, instance, ("project_lead_id",))


@receiver(post_save, sender=Project)
def record_project(sender, instance, created, **kwargs):
    previous = getattr(instance, "_semec_previous", None)
    if created or previous is None:
        return
    if previous["project_lead_id"] != instance.project_lead_id:
        _record(instance.id, "updated", "lead", previous["project_lead_id"], instance.project_lead_id)
