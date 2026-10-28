# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Module imports
from plane.app.permissions import ROLE
from plane.db.models import ProjectMember


def is_restricted_guest(user, project):
    """True when the user is a guest of a project that hides its features from guests"""
    if project.guest_view_all_features:
        return False
    return ProjectMember.objects.filter(
        project_id=project.id, member=user, is_active=True, role=ROLE.GUEST.value
    ).exists()
