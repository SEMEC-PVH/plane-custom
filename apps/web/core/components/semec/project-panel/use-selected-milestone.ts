/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { EIssuesStoreType } from "@plane/types";
import { toFilterArray } from "@plane/utils";
import { useModule } from "@/hooks/store/use-module";
import { useWorkItemFilters } from "@/hooks/store/work-item-filters/use-work-item-filters";

/**
 * The selected milestone is the work-item list's own module filter (which Plane saves per user), so the
 * panel and the list always agree: after a reload, or when the filter is cleared from Plane's filter chips.
 * It counts as selected only when the filter holds exactly one module that still exists in the project.
 */
export const useSemecSelectedMilestone = (projectId: string): string | null => {
  const { getFilter } = useWorkItemFilters();
  const { getProjectModuleIds } = useModule();
  const condition = getFilter(EIssuesStoreType.PROJECT, projectId)?.findFirstConditionByPropertyAndOperator(
    "module_id",
    "in"
  );
  const moduleIds = toFilterArray(condition?.value ?? []) as string[];
  if (moduleIds.length !== 1) return null;
  return (getProjectModuleIds(projectId) ?? []).includes(moduleIds[0]) ? moduleIds[0] : null;
};
