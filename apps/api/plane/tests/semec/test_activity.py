# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date

import pytest
from rest_framework import status

from plane.db.models import Module, ProjectMember
from plane.semec.models import ProjectActivity

from .conftest import make_user


def activity_url(project, limit=None):
    url = f"/api/workspaces/{project.workspace.slug}/projects/{project.id}/semec/activity/"
    return f"{url}?limit={limit}" if limit else url


def properties_url(project):
    return f"/api/workspaces/{project.workspace.slug}/projects/{project.id}/semec/properties/"


def chronological(project):
    return list(ProjectActivity.objects.filter(project=project).order_by("created_at"))


@pytest.mark.contract
class TestProjectActivity:
    @pytest.mark.django_db
    def test_module_create_rename_retarget_delete(self, project):
        module = Module.objects.create(name="Homologação", project=project)
        module.name = "Homologação no ar"
        module.save()
        module.target_date = date(2026, 10, 16)
        module.save()
        module.delete()

        records = chronological(project)

        assert [(r.verb, r.field) for r in records] == [
            ("created", "milestone"),
            ("updated", "milestone.name"),
            ("updated", "milestone.target_date"),
            ("deleted", "milestone"),
        ]
        assert records[0].new_value == "Homologação"
        assert records[1].old_value == "Homologação"
        assert records[1].new_value == "Homologação no ar"
        assert records[2].new_value == "2026-10-16"
        assert records[3].old_value == "Homologação no ar"
        assert all(r.module_id == module.id for r in records)

    @pytest.mark.django_db
    def test_properties_patch_logs_each_changed_field(self, session_client, project, create_user):
        payload = {"status": "in-progress", "priority": "high"}

        session_client.patch(properties_url(project), payload, format="json")
        session_client.patch(properties_url(project), payload, format="json")

        records = chronological(project)
        assert sorted((r.field, r.old_value, r.new_value) for r in records) == [
            ("priority", "none", "high"),
            ("status", "backlog", "in-progress"),
        ]
        assert all(r.actor_id == create_user.id for r in records)

    @pytest.mark.django_db
    def test_lead_change_logged(self, project, create_user):
        project.project_lead = create_user
        project.save()

        records = chronological(project)

        assert [(r.field, r.old_value, r.new_value) for r in records] == [("lead", None, str(create_user.id))]

    @pytest.mark.django_db
    def test_member_add_not_logged(self, project, workspace):
        user = make_user("novo@semec.test")

        ProjectMember.objects.bulk_create([ProjectMember(project=project, workspace=workspace, member=user, role=15)])

        assert ProjectActivity.objects.filter(project=project).count() == 0

    @pytest.mark.django_db
    def test_limit_param(self, session_client, project):
        for number in range(7):
            Module.objects.create(name=f"M{number}", project=project)

        response = session_client.get(activity_url(project, limit=5))

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 5
        assert response.data[0]["new_value"] == "M6"
        assert response.data[0]["field"] == "milestone"

    @pytest.mark.django_db
    def test_actor_is_serialized(self, session_client, project, create_user):
        session_client.patch(properties_url(project), {"status": "paused"}, format="json")

        response = session_client.get(activity_url(project))

        assert response.data[0]["actor"]["id"] == str(create_user.id)

    @pytest.mark.django_db
    def test_outsider_forbidden(self, outsider_client, project):
        assert outsider_client.get(activity_url(project)).status_code == status.HTTP_403_FORBIDDEN
