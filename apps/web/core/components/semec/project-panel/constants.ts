/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { MODULE_STATUS_COLORS } from "@plane/constants";
import type { TSemecProjectPriority, TSemecProjectStatus } from "@plane/types";

export const SEMEC_PROJECT_PANEL_STORAGE_KEY = "semec_project_panel_open";

// Same statuses (and colors) Plane uses for modules
export const SEMEC_PROJECT_STATUSES: TSemecProjectStatus[] = [
  "backlog",
  "planned",
  "in-progress",
  "paused",
  "completed",
  "cancelled",
];

export const SEMEC_PROJECT_PRIORITIES: TSemecProjectPriority[] = ["urgent", "high", "medium", "low", "none"];

export const getSemecStatusColor = (status: TSemecProjectStatus) => MODULE_STATUS_COLORS[status];

export const getSemecStatusI18nKey = (status: TSemecProjectStatus) =>
  `semec.project_status.${status.replace("-", "_")}`;

export const getSemecPriorityI18nKey = (priority: TSemecProjectPriority) => `semec.project_priority.${priority}`;
