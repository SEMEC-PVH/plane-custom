# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from uuid import UUID

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Module, Project
from plane.semec.permissions import is_restricted_guest
from plane.semec.progress import compute_progress


class ProjectProgressEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        project = Project.objects.get(workspace__slug=slug, pk=project_id)
        if is_restricted_guest(request.user, project):
            return Response(
                {"error": "You don't have the required permissions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        module_id = request.GET.get("module_id")
        if module_id:
            try:
                module_id = UUID(module_id)
            except ValueError:
                return Response({"error": "Invalid module_id."}, status=status.HTTP_400_BAD_REQUEST)
            if not Module.objects.filter(pk=module_id, project_id=project.id).exists():
                return Response({"error": "Module not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(compute_progress(project, module_id=module_id), status=status.HTTP_200_OK)
