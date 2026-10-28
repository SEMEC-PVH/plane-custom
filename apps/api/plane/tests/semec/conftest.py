# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from uuid import uuid4

import pytest
from rest_framework.test import APIClient

from plane.db.models import Project, ProjectMember, State, User, WorkspaceMember


def make_user(email):
    """Create a user with a unique username"""
    return User.objects.create(email=email, username=uuid4().hex, first_name=email.split("@")[0])


def client_for(user):
    """Return a session-authenticated client for the given user"""
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def add_member(workspace, project, user, role):
    """Add the user to the workspace and, when a project is given, to the project"""
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=role)
    if project is not None:
        ProjectMember.objects.create(workspace=workspace, project=project, member=user, role=role)


@pytest.fixture
def project(db, workspace, create_user):
    """A project where the default user is an admin, with one state per group"""
    created_project = Project.objects.create(name="SISConforme", identifier="SISC", workspace=workspace)
    ProjectMember.objects.create(workspace=workspace, project=created_project, member=create_user, role=20)
    return created_project


@pytest.fixture
def states(project):
    """Map of state group to State"""
    groups = [
        ("Backlog", "backlog"),
        ("Todo", "unstarted"),
        ("Doing", "started"),
        ("Done", "completed"),
        ("Cancelled", "cancelled"),
    ]
    return {
        group: State.objects.create(
            name=name, group=group, color="#000000", project=project, default=group == "backlog"
        )
        for name, group in groups
    }


@pytest.fixture
def member_client(workspace, project):
    return client_for_role(workspace, project, "member@semec.test", 15)


@pytest.fixture
def guest_client(workspace, project):
    return client_for_role(workspace, project, "guest@semec.test", 5)


@pytest.fixture
def outsider_client(workspace, project):
    user = make_user("outsider@semec.test")
    add_member(workspace, None, user, 15)
    return client_for(user)


def client_for_role(workspace, project, email, role):
    user = make_user(email)
    add_member(workspace, project, user, role)
    return client_for(user)
