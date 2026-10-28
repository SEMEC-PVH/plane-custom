# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date, datetime, timezone as dt_timezone

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import Issue, IssueActivity, IssueAssignee, Module, ModuleIssue
from plane.semec.models import ProjectProperties
from plane.semec.progress import compute_progress


def progress_url(project, module_id=None):
    url = f"/api/workspaces/{project.workspace.slug}/projects/{project.id}/semec/progress/"
    return f"{url}?module_id={module_id}" if module_id else url


def make_issue(project, state, name="Item", created=None, completed=None):
    issue = Issue.objects.create(name=name, project=project, state=state)
    updates = {}
    if created:
        updates["created_at"] = created
    updates["completed_at"] = completed
    Issue.all_objects.filter(pk=issue.pk).update(**updates)
    issue.refresh_from_db()
    return issue


def at(day, month=10):
    return datetime(2026, month, day, 12, 0, tzinfo=dt_timezone.utc)


@pytest.mark.contract
class TestProjectProgress:
    @pytest.mark.django_db
    def test_counts_exclude_cancelled(self, session_client, project, states):
        make_issue(project, states["backlog"])
        for _ in range(2):
            make_issue(project, states["started"])
        for _ in range(3):
            make_issue(project, states["completed"], completed=timezone.now())
        make_issue(project, states["cancelled"])

        response = session_client.get(progress_url(project))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["scope"] == 6
        assert response.data["started"] == 2
        assert response.data["completed"] == 3

    @pytest.mark.django_db
    def test_empty_project_returns_zeros_and_empty_series(self, session_client, project, states):
        response = session_client.get(progress_url(project))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["scope"] == 0
        assert response.data["started"] == 0
        assert response.data["completed"] == 0
        assert response.data["series"] == []
        assert response.data["assignees"] == []

    @pytest.mark.django_db
    def test_module_filter_and_double_membership(self, session_client, project, states):
        first = Module.objects.create(name="M1", project=project)
        second = Module.objects.create(name="M2", project=project)
        issue = make_issue(project, states["started"])
        make_issue(project, states["started"])
        ModuleIssue.objects.create(module=first, issue=issue, project=project)
        ModuleIssue.objects.create(module=second, issue=issue, project=project)

        first_response = session_client.get(progress_url(project, first.id))
        second_response = session_client.get(progress_url(project, second.id))

        assert first_response.data["scope"] == 1
        assert second_response.data["scope"] == 1
        assert first_response.data["no_milestone"] == 0

    @pytest.mark.django_db
    def test_no_milestone_ignores_deleted_links_and_modules(self, session_client, project, states):
        live_module = Module.objects.create(name="Vivo", project=project)
        deleted_module = Module.objects.create(name="Apagado", project=project)
        linked = make_issue(project, states["started"], name="Ligado")
        unlinked_by_delete = make_issue(project, states["started"], name="Vínculo apagado")
        in_deleted_module = make_issue(project, states["started"], name="Módulo apagado")
        ModuleIssue.objects.create(module=live_module, issue=linked, project=project)
        link = ModuleIssue.objects.create(module=live_module, issue=unlinked_by_delete, project=project)
        ModuleIssue.all_objects.filter(pk=link.pk).update(deleted_at=timezone.now())
        ModuleIssue.objects.create(module=deleted_module, issue=in_deleted_module, project=project)
        Module.all_objects.filter(pk=deleted_module.pk).update(deleted_at=timezone.now())

        response = session_client.get(progress_url(project))

        assert response.data["scope"] == 3
        assert response.data["no_milestone"] == 2

    @pytest.mark.django_db
    def test_assignee_rows_include_unassigned(self, session_client, project, states, create_user):
        assigned = make_issue(project, states["completed"], completed=timezone.now())
        IssueAssignee.objects.create(issue=assigned, assignee=create_user, project=project)
        make_issue(project, states["backlog"])

        response = session_client.get(progress_url(project))

        rows = {row["assignee_id"]: row for row in response.data["assignees"]}
        assert rows[str(create_user.id)]["total"] == 1
        assert rows[str(create_user.id)]["completed"] == 1
        assert rows[None]["total"] == 1
        assert rows[None]["completed"] == 0

    @pytest.mark.django_db
    def test_series_by_day(self, project, states):
        ProjectProperties.objects.create(project=project, start_date=date(2026, 10, 5))
        make_issue(project, states["completed"], created=at(5), completed=at(6))

        result = compute_progress(project, today=date(2026, 10, 7))

        assert result["series"] == [
            {"date": "2026-10-05", "scope": 1, "started": 0, "completed": 0},
            {"date": "2026-10-06", "scope": 1, "started": 1, "completed": 1},
            {"date": "2026-10-07", "scope": 1, "started": 1, "completed": 1},
        ]

    @pytest.mark.django_db
    def test_series_started_uses_state_activity(self, project, states):
        ProjectProperties.objects.create(project=project, start_date=date(2026, 10, 5))
        issue = make_issue(project, states["started"], created=at(5))
        activity = IssueActivity.objects.create(
            issue=issue, project=project, verb="updated", field="state", new_identifier=states["started"].id
        )
        IssueActivity.objects.filter(pk=activity.pk).update(created_at=at(6))

        result = compute_progress(project, today=date(2026, 10, 6))

        assert [point["started"] for point in result["series"]] == [0, 1]

    @pytest.mark.django_db
    def test_series_without_start_date_begins_at_first_item(self, project, states):
        make_issue(project, states["backlog"], created=at(6))

        result = compute_progress(project, today=date(2026, 10, 7))

        assert [point["date"] for point in result["series"]] == ["2026-10-06", "2026-10-07"]

    @pytest.mark.django_db
    def test_guest_without_view_all_is_forbidden(self, guest_client, project, states):
        project.guest_view_all_features = False
        project.save()

        assert guest_client.get(progress_url(project)).status_code == status.HTTP_403_FORBIDDEN

        project.guest_view_all_features = True
        project.save()

        assert guest_client.get(progress_url(project)).status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_outsider_forbidden(self, outsider_client, project):
        assert outsider_client.get(progress_url(project)).status_code == status.HTTP_403_FORBIDDEN
