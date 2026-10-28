/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, makeObservable, observable, runInAction } from "mobx";
import type {
  TSemecProjectActivity,
  TSemecProjectProgress,
  TSemecProjectProperties,
  TSemecProjectSummary,
} from "@plane/types";
// services
import { SemecProjectPanelService } from "@/services/semec/project-panel.service";

export const getProgressKey = (projectId: string, moduleId?: string | null) => `${projectId}:${moduleId ?? "all"}`;

export interface ISemecProjectPanelStore {
  // observables
  propertiesMap: Record<string, TSemecProjectProperties>;
  progressMap: Record<string, TSemecProjectProgress>;
  activityMap: Record<string, TSemecProjectActivity[]>;
  summaryMap: Record<string, TSemecProjectSummary>;
  selectedModuleId: Record<string, string | null>;
  // actions
  fetchProperties: (workspaceSlug: string, projectId: string) => Promise<TSemecProjectProperties>;
  updateProperties: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TSemecProjectProperties>
  ) => Promise<TSemecProjectProperties>;
  fetchProgress: (workspaceSlug: string, projectId: string, moduleId?: string) => Promise<TSemecProjectProgress>;
  fetchActivity: (workspaceSlug: string, projectId: string, limit?: number) => Promise<TSemecProjectActivity[]>;
  fetchSummaries: (workspaceSlug: string) => Promise<TSemecProjectSummary[]>;
  setSelectedModule: (projectId: string, moduleId: string | null) => void;
}

export class SemecProjectPanelStore implements ISemecProjectPanelStore {
  propertiesMap: Record<string, TSemecProjectProperties> = {};
  progressMap: Record<string, TSemecProjectProgress> = {};
  activityMap: Record<string, TSemecProjectActivity[]> = {};
  summaryMap: Record<string, TSemecProjectSummary> = {};
  selectedModuleId: Record<string, string | null> = {};
  // services
  service = new SemecProjectPanelService();

  constructor() {
    makeObservable(this, {
      propertiesMap: observable,
      progressMap: observable,
      activityMap: observable,
      summaryMap: observable,
      selectedModuleId: observable,
      fetchProperties: action,
      updateProperties: action,
      fetchProgress: action,
      fetchActivity: action,
      fetchSummaries: action,
      setSelectedModule: action,
    });
  }

  fetchProperties = async (workspaceSlug: string, projectId: string) => {
    const properties = await this.service.getProperties(workspaceSlug, projectId);
    runInAction(() => {
      this.propertiesMap[projectId] = properties;
    });
    return properties;
  };

  updateProperties = async (workspaceSlug: string, projectId: string, data: Partial<TSemecProjectProperties>) => {
    const previous = this.propertiesMap[projectId];
    if (previous) this.propertiesMap[projectId] = { ...previous, ...data };
    try {
      const properties = await this.service.updateProperties(workspaceSlug, projectId, data);
      runInAction(() => {
        this.propertiesMap[projectId] = properties;
        const summary = this.summaryMap[projectId];
        if (summary) this.summaryMap[projectId] = { ...summary, ...properties };
      });
      return properties;
    } catch (error) {
      runInAction(() => {
        if (previous) this.propertiesMap[projectId] = previous;
      });
      throw error;
    }
  };

  fetchProgress = async (workspaceSlug: string, projectId: string, moduleId?: string) => {
    const progress = await this.service.getProgress(workspaceSlug, projectId, moduleId);
    runInAction(() => {
      this.progressMap[getProgressKey(projectId, moduleId)] = progress;
    });
    return progress;
  };

  fetchActivity = async (workspaceSlug: string, projectId: string, limit?: number) => {
    const activity = await this.service.getActivity(workspaceSlug, projectId, limit);
    runInAction(() => {
      this.activityMap[projectId] = activity;
    });
    return activity;
  };

  fetchSummaries = async (workspaceSlug: string) => {
    const summaries = await this.service.getProjectSummaries(workspaceSlug);
    runInAction(() => {
      this.summaryMap = Object.fromEntries(summaries.map((summary) => [summary.project_id, summary]));
    });
    return summaries;
  };

  setSelectedModule = (projectId: string, moduleId: string | null) => {
    this.selectedModuleId[projectId] = moduleId;
  };
}
