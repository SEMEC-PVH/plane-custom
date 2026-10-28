# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.semec.views import ProjectProgressEndpoint, ProjectPropertiesEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/semec/progress/",
        ProjectProgressEndpoint.as_view(),
        name="semec-project-progress",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/semec/properties/",
        ProjectPropertiesEndpoint.as_view(),
        name="semec-project-properties",
    ),
]
