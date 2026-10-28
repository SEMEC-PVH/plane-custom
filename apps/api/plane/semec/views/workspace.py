# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db.models import Count, Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Issue, ProjectMember
from plane.semec.models import ProjectProperties


def _as_date(value):
    return value.isoformat() if value else None


class WorkspaceProjectSummaryEndpoint(BaseAPIView):
    """Properties and progress of the projects the user is a member of, for the project cards"""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        memberships = list(
            ProjectMember.objects.filter(
                workspace__slug=slug,
                member=request.user,
                is_active=True,
                project__archived_at__isnull=True,
            ).values_list("project_id", "role", "project__guest_view_all_features")
        )
        project_ids = [project_id for project_id, _, _ in memberships]
        # Guests of projects that hide their features from guests do not see progress counts
        hidden_counts = {
            project_id
            for project_id, role, guest_view_all in memberships
            if role == ROLE.GUEST.value and not guest_view_all
        }
        properties = {item.project_id: item for item in ProjectProperties.objects.filter(project_id__in=project_ids)}
        counts = {
            row["project_id"]: row
            for row in Issue.issue_objects.filter(project_id__in=project_ids)
            .exclude(state__group="cancelled")
            .values("project_id")
            .annotate(scope=Count("id"), completed=Count("id", filter=Q(state__group="completed")))
        }

        summaries = []
        for project_id in project_ids:
            stored = properties.get(project_id)
            count = counts.get(project_id, {})
            summaries.append(
                {
                    "project_id": str(project_id),
                    "status": stored.status if stored else "backlog",
                    "priority": stored.priority if stored else "none",
                    "start_date": _as_date(stored.start_date) if stored else None,
                    "target_date": _as_date(stored.target_date) if stored else None,
                    "scope": None if project_id in hidden_counts else count.get("scope", 0),
                    "completed": None if project_id in hidden_counts else count.get("completed", 0),
                }
            )
        return Response(summaries, status=status.HTTP_200_OK)
