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
from plane.semec.models import get_or_default_properties
from plane.semec.serializers import ProjectPropertiesSerializer


class ProjectPropertiesEndpoint(BaseAPIView):
    def get_project(self, slug, project_id):
        return Project.objects.get(workspace__slug=slug, pk=project_id)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        properties = get_or_default_properties(self.get_project(slug, project_id))
        return Response(ProjectPropertiesSerializer(properties).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def patch(self, request, slug, project_id):
        properties = get_or_default_properties(self.get_project(slug, project_id))
        serializer = ProjectPropertiesSerializer(properties, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
