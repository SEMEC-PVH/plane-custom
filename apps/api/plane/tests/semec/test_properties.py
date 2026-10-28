# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status

from plane.semec.models import ProjectProperties


def properties_url(project):
    return f"/api/workspaces/{project.workspace.slug}/projects/{project.id}/semec/properties/"


@pytest.mark.contract
class TestProjectProperties:
    @pytest.mark.django_db
    def test_get_returns_defaults_without_row(self, session_client, project):
        response = session_client.get(properties_url(project))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["project_id"] == str(project.id)
        assert response.data["status"] == "backlog"
        assert response.data["priority"] == "none"
        assert response.data["start_date"] is None
        assert response.data["target_date"] is None
        assert ProjectProperties.objects.count() == 0

    @pytest.mark.django_db
    def test_patch_creates_row(self, session_client, project):
        payload = {"status": "in-progress", "start_date": "2026-10-05", "target_date": "2026-11-09"}

        response = session_client.patch(properties_url(project), payload, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "in-progress"
        assert response.data["start_date"] == "2026-10-05"
        assert response.data["target_date"] == "2026-11-09"
        assert ProjectProperties.objects.filter(project=project).count() == 1

    @pytest.mark.django_db
    def test_patch_rejects_target_before_start(self, session_client, project):
        payload = {"start_date": "2026-11-10", "target_date": "2026-11-09"}

        response = session_client.patch(properties_url(project), payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert ProjectProperties.objects.count() == 0

    @pytest.mark.django_db
    def test_patch_rejects_target_before_stored_start(self, session_client, project):
        session_client.patch(properties_url(project), {"start_date": "2026-11-10"}, format="json")

        response = session_client.patch(properties_url(project), {"target_date": "2026-11-09"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert ProjectProperties.objects.get(project=project).target_date is None

    @pytest.mark.django_db
    def test_patch_rejects_unknown_status(self, session_client, project):
        response = session_client.patch(properties_url(project), {"status": "done"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_member_can_patch(self, member_client, project):
        response = member_client.patch(properties_url(project), {"priority": "high"}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["priority"] == "high"

    @pytest.mark.django_db
    def test_guest_cannot_patch(self, guest_client, project):
        response = guest_client.patch(properties_url(project), {"priority": "high"}, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_guest_can_get(self, guest_client, project):
        response = guest_client.get(properties_url(project))

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_outsider_cannot_get(self, outsider_client, project):
        response = outsider_client.get(properties_url(project))

        assert response.status_code == status.HTTP_403_FORBIDDEN
