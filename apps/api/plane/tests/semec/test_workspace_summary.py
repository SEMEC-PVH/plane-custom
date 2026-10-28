# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import Issue, Project
from plane.semec.models import ProjectProperties

from .conftest import client_for, make_user


def summary_url(workspace):
    return f"/api/workspaces/{workspace.slug}/semec/projects/"


@pytest.mark.contract
class TestWorkspaceProjectSummary:
    @pytest.mark.django_db
    def test_only_member_projects_listed(self, session_client, workspace, project):
        Project.objects.create(name="Secreto", identifier="SEC", workspace=workspace)
        archived = Project.objects.create(name="Arquivado", identifier="ARQ", workspace=workspace)
        archived.archived_at = timezone.now()
        archived.save()

        response = session_client.get(summary_url(workspace))

        assert response.status_code == status.HTTP_200_OK
        assert [row["project_id"] for row in response.data] == [str(project.id)]

    @pytest.mark.django_db
    def test_defaults_and_counts(self, session_client, workspace, project, states):
        Issue.objects.create(name="A", project=project, state=states["backlog"])
        Issue.objects.create(name="B", project=project, state=states["completed"])
        Issue.objects.create(name="C", project=project, state=states["cancelled"])

        response = session_client.get(summary_url(workspace))

        row = response.data[0]
        assert row["status"] == "backlog"
        assert row["priority"] == "none"
        assert row["start_date"] is None
        assert row["target_date"] is None
        assert row["scope"] == 2
        assert row["completed"] == 1

    @pytest.mark.django_db
    def test_stored_properties_returned(self, session_client, workspace, project):
        ProjectProperties.objects.create(project=project, status="in-progress", priority="high")

        response = session_client.get(summary_url(workspace))

        assert response.data[0]["status"] == "in-progress"
        assert response.data[0]["priority"] == "high"
        assert response.data[0]["scope"] == 0

    @pytest.mark.django_db
    def test_restricted_guest_gets_no_counts(self, guest_client, workspace, project, states):
        Issue.objects.create(name="A", project=project, state=states["backlog"])
        project.guest_view_all_features = False
        project.save()

        response = guest_client.get(summary_url(workspace))

        assert response.data[0]["status"] == "backlog"
        assert response.data[0]["scope"] is None
        assert response.data[0]["completed"] is None

    @pytest.mark.django_db
    def test_non_workspace_member_forbidden(self, workspace, project):
        stranger = client_for(make_user("estranho@semec.test"))

        assert stranger.get(summary_url(workspace)).status_code == status.HTTP_403_FORBIDDEN
