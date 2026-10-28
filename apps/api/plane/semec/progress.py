# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from bisect import bisect_right
from datetime import timedelta
from zoneinfo import ZoneInfo

# Django imports
from django.db.models import Min
from django.utils import timezone

# Module imports
from plane.db.models import Issue, IssueActivity, IssueAssignee, IssueLabel, Module, ModuleIssue, State
from plane.semec.models import get_or_default_properties


def scope_queryset(project_id, module_id=None):
    """Work items that count toward progress: everything except cancelled ones"""
    queryset = Issue.issue_objects.filter(project_id=project_id).exclude(state__group="cancelled")
    if module_id:
        linked_ids = ModuleIssue.objects.filter(module_id=module_id).values_list("issue_id", flat=True)
        queryset = queryset.filter(id__in=linked_ids)
    return queryset


def _avatar_url(avatar_asset_id, avatar):
    if avatar_asset_id:
        return f"/api/assets/v2/static/{avatar_asset_id}/"
    return avatar or None


def _sorted_rows(rows, name_key):
    return sorted(rows.values(), key=lambda row: (row[name_key] is None, (row[name_key] or "").lower()))


def _assignee_rows(issues):
    completed_ids = {issue["id"] for issue in issues if issue["state__group"] == "completed"}
    assigned = IssueAssignee.objects.filter(issue_id__in=[issue["id"] for issue in issues]).values(
        "issue_id",
        "assignee_id",
        "assignee__display_name",
        "assignee__avatar",
        "assignee__avatar_asset_id",
    )
    rows = {}
    assigned_issue_ids = set()
    for item in assigned:
        assigned_issue_ids.add(item["issue_id"])
        key = str(item["assignee_id"])
        row = rows.setdefault(
            key,
            {
                "assignee_id": key,
                "display_name": item["assignee__display_name"],
                "avatar_url": _avatar_url(item["assignee__avatar_asset_id"], item["assignee__avatar"]),
                "total": 0,
                "completed": 0,
            },
        )
        row["total"] += 1
        row["completed"] += item["issue_id"] in completed_ids
    unassigned = [issue["id"] for issue in issues if issue["id"] not in assigned_issue_ids]
    if unassigned:
        rows[None] = {
            "assignee_id": None,
            "display_name": None,
            "avatar_url": None,
            "total": len(unassigned),
            "completed": len(completed_ids.intersection(unassigned)),
        }
    return _sorted_rows(rows, "display_name")


def _label_rows(issues):
    completed_ids = {issue["id"] for issue in issues if issue["state__group"] == "completed"}
    labelled = IssueLabel.objects.filter(
        issue_id__in=[issue["id"] for issue in issues], label__deleted_at__isnull=True
    ).values("issue_id", "label_id", "label__name", "label__color")
    rows = {}
    labelled_issue_ids = set()
    for item in labelled:
        labelled_issue_ids.add(item["issue_id"])
        key = str(item["label_id"])
        row = rows.setdefault(
            key,
            {"label_id": key, "name": item["label__name"], "color": item["label__color"], "total": 0, "completed": 0},
        )
        row["total"] += 1
        row["completed"] += item["issue_id"] in completed_ids
    unlabelled = [issue["id"] for issue in issues if issue["id"] not in labelled_issue_ids]
    if unlabelled:
        rows[None] = {
            "label_id": None,
            "name": None,
            "color": None,
            "total": len(unlabelled),
            "completed": len(completed_ids.intersection(unlabelled)),
        }
    return _sorted_rows(rows, "name")


def _no_milestone_count(project_id, issue_ids):
    linked = set(
        ModuleIssue.objects.filter(
            project_id=project_id,
            issue_id__in=issue_ids,
            module__deleted_at__isnull=True,
            module__archived_at__isnull=True,
        ).values_list("issue_id", flat=True)
    )
    return len(set(issue_ids) - linked)


def _series(issues, project, start_date, today, tz):
    """Daily scope / started / completed counts from start_date to today"""
    if not issues:
        return []
    if start_date is None:
        start_date = min(issue["created_at"].astimezone(tz).date() for issue in issues)
    if start_date > today:
        return []

    started_state_ids = State.objects.filter(project_id=project.id, group="started").values_list("id", flat=True)
    first_started = dict(
        IssueActivity.objects.filter(
            issue_id__in=[issue["id"] for issue in issues],
            field="state",
            new_identifier__in=started_state_ids,
        )
        .values("issue_id")
        .annotate(first=Min("created_at"))
        .values_list("issue_id", "first")
    )

    created_days, started_days, completed_days = [], [], []
    for issue in issues:
        created_days.append(issue["created_at"].astimezone(tz).date())
        group = issue["state__group"]
        completed_at = issue["completed_at"]
        if group == "completed" and completed_at:
            completed_days.append(completed_at.astimezone(tz).date())
        if group in ("started", "completed"):
            started_at = first_started.get(issue["id"]) or completed_at or issue["created_at"]
            started_days.append(started_at.astimezone(tz).date())
    created_days.sort()
    started_days.sort()
    completed_days.sort()

    points = []
    day = start_date
    while day <= today:
        points.append(
            {
                "date": day.isoformat(),
                "scope": bisect_right(created_days, day),
                "started": bisect_right(started_days, day),
                "completed": bisect_right(completed_days, day),
            }
        )
        day += timedelta(days=1)
    return points


def compute_progress(project, module_id=None, today=None):
    """Progress of the project, or of one of its modules when module_id is given"""
    tz = ZoneInfo(project.timezone or "UTC")
    today = today or timezone.now().astimezone(tz).date()
    issues = list(scope_queryset(project.id, module_id).values("id", "state__group", "created_at", "completed_at"))

    if module_id:
        module = Module.objects.get(pk=module_id, project_id=project.id)
        start_date, target_date = module.start_date, module.target_date
    else:
        properties = get_or_default_properties(project)
        start_date, target_date = properties.start_date, properties.target_date

    return {
        "scope": len(issues),
        "started": sum(issue["state__group"] == "started" for issue in issues),
        "completed": sum(issue["state__group"] == "completed" for issue in issues),
        "no_milestone": 0 if module_id else _no_milestone_count(project.id, [issue["id"] for issue in issues]),
        "assignees": _assignee_rows(issues),
        "labels": _label_rows(issues),
        "series": _series(issues, project, start_date, today, tz),
        "start_date": start_date.isoformat() if start_date else None,
        "target_date": target_date.isoformat() if target_date else None,
    }
