/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { orderBy as lodashOrderBy } from "lodash-es";
import type {
  TProject,
  TProjectFilters,
  TProjectOrderByOptions,
  TSemecProjectPriority,
  TSemecProjectStatus,
  TSemecProjectSummary,
} from "@plane/types";

const STATUS_ORDER: TSemecProjectStatus[] = ["backlog", "planned", "in-progress", "paused", "completed", "cancelled"];
const PRIORITY_ORDER: TSemecProjectPriority[] = ["urgent", "high", "medium", "low", "none"];

export const isSemecOrderBy = (orderBy: TProjectOrderByOptions | undefined) =>
  !!orderBy && orderBy.replace(/^-/, "").startsWith("semec_");

const statusOf = (summary: TSemecProjectSummary | undefined) => summary?.status ?? "backlog";
const priorityOf = (summary: TSemecProjectSummary | undefined) => summary?.priority ?? "none";

/**
 * Filters by the SEMEC status/priority filters and, when the order is a SEMEC one, sorts by it.
 * Projects without a summary count as backlog / no priority; projects without a date go last.
 */
export const applySemecProjectFilters = (
  projects: TProject[],
  summaries: Record<string, TSemecProjectSummary>,
  filters: TProjectFilters | undefined,
  orderBy: TProjectOrderByOptions | undefined
): TProject[] => {
  const statuses = filters?.semec_status ?? [];
  const priorities = filters?.semec_priority ?? [];
  const filtered = projects.filter(
    (project) =>
      (statuses.length === 0 || statuses.includes(statusOf(summaries[project.id]))) &&
      (priorities.length === 0 || priorities.includes(priorityOf(summaries[project.id])))
  );
  if (!orderBy || !isSemecOrderBy(orderBy)) return filtered;

  const direction = orderBy.startsWith("-") ? "desc" : "asc";
  const key = orderBy.replace(/^-/, "");
  if (key === "semec_status")
    return lodashOrderBy(filtered, (p) => STATUS_ORDER.indexOf(statusOf(summaries[p.id])), direction);
  if (key === "semec_priority")
    return lodashOrderBy(filtered, (p) => PRIORITY_ORDER.indexOf(priorityOf(summaries[p.id])), direction);

  const field = key === "semec_target_date" ? "target_date" : "start_date";
  const dated = filtered.filter((p) => summaries[p.id]?.[field]);
  const undated = filtered.filter((p) => !summaries[p.id]?.[field]);
  return [...lodashOrderBy(dated, (p) => summaries[p.id][field], direction), ...undated];
};
