# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.semec.models import ProjectProperties


class ProjectPropertiesSerializer(serializers.ModelSerializer):
    project_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = ProjectProperties
        fields = ["project_id", "status", "priority", "start_date", "target_date"]

    def validate(self, attrs):
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        target_date = attrs.get("target_date", getattr(self.instance, "target_date", None))
        if start_date and target_date and target_date < start_date:
            raise serializers.ValidationError({"target_date": "Target date cannot be before the start date."})
        return attrs
