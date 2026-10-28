# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import models

# Module imports
from plane.db.models.base import BaseModel


class ProjectProperties(BaseModel):
    """Project-level properties that Plane CE does not store"""

    STATUS_CHOICES = (
        ("backlog", "Backlog"),
        ("planned", "Planned"),
        ("in-progress", "In Progress"),
        ("paused", "Paused"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    )
    PRIORITY_CHOICES = (
        ("urgent", "Urgent"),
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
        ("none", "None"),
    )

    project = models.OneToOneField("db.Project", on_delete=models.CASCADE, related_name="semec_properties")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="semec_project_properties")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="backlog")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="none")
    start_date = models.DateField(null=True, blank=True)
    target_date = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = "Project Properties"
        verbose_name_plural = "Project Properties"
        db_table = "semec_project_properties"

    def save(self, *args, **kwargs):
        self.workspace_id = self.project.workspace_id
        super().save(*args, **kwargs)


class ProjectActivity(BaseModel):
    """Changes made to a project: milestones (modules), properties and lead"""

    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="semec_activities")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="semec_project_activities")
    actor = models.ForeignKey(
        "db.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="semec_project_activities"
    )
    verb = models.CharField(max_length=20)
    field = models.CharField(max_length=40)
    old_value = models.TextField(null=True, blank=True)
    new_value = models.TextField(null=True, blank=True)
    module = models.ForeignKey(
        "db.Module", on_delete=models.SET_NULL, null=True, blank=True, related_name="semec_project_activities"
    )

    class Meta:
        verbose_name = "Project Activity"
        verbose_name_plural = "Project Activities"
        db_table = "semec_project_activities"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        self.workspace_id = self.project.workspace_id
        super().save(*args, **kwargs)


def get_or_default_properties(project):
    """Return the stored properties of the project, or an unsaved instance with the defaults"""
    properties = ProjectProperties.objects.filter(project=project).first()
    return properties or ProjectProperties(project=project, workspace_id=project.workspace_id)
