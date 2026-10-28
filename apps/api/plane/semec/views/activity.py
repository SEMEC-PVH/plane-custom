# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Project
from plane.semec.models import ProjectActivity
from plane.semec.permissions import is_restricted_guest

MAX_LIMIT = 200


def serialize_activity(activity):
    actor = activity.actor
    return {
        "id": str(activity.id),
        "created_at": activity.created_at,
        "actor": (
            {"id": str(actor.id), "display_name": actor.display_name, "avatar_url": actor.avatar_url}
            if actor
            else None
        ),
        "verb": activity.verb,
        "field": activity.field,
        "old_value": activity.old_value,
        "new_value": activity.new_value,
        "module_id": str(activity.module_id) if activity.module_id else None,
    }


class ProjectActivityEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        project = Project.objects.get(workspace__slug=slug, pk=project_id)
        if is_restricted_guest(request.user, project):
            return Response(
                {"error": "You don't have the required permissions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            limit = min(int(request.GET.get("limit", MAX_LIMIT)), MAX_LIMIT)
        except ValueError:
            return Response({"error": "Invalid limit."}, status=status.HTTP_400_BAD_REQUEST)
        if limit < 1:
            return Response({"error": "Invalid limit."}, status=status.HTTP_400_BAD_REQUEST)

        activities = ProjectActivity.objects.filter(project=project).select_related("actor")[:limit]
        return Response([serialize_activity(activity) for activity in activities], status=status.HTTP_200_OK)
