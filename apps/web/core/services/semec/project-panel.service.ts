/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  TSemecProjectActivity,
  TSemecProjectProgress,
  TSemecProjectProperties,
  TSemecProjectSummary,
} from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export class SemecProjectPanelService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getProperties(workspaceSlug: string, projectId: string): Promise<TSemecProjectProperties> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/semec/properties/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProperties(
    workspaceSlug: string,
    projectId: string,
    data: Partial<TSemecProjectProperties>
  ): Promise<TSemecProjectProperties> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/semec/properties/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProgress(workspaceSlug: string, projectId: string, moduleId?: string): Promise<TSemecProjectProgress> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/semec/progress/`, {
      params: moduleId ? { module_id: moduleId } : {},
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getActivity(workspaceSlug: string, projectId: string, limit?: number): Promise<TSemecProjectActivity[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/semec/activity/`, {
      params: limit ? { limit } : {},
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProjectSummaries(workspaceSlug: string): Promise<TSemecProjectSummary[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/semec/projects/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
