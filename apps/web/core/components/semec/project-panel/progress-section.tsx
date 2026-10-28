/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
import { EIssuesStoreType } from "@plane/types";
import { cn, toFilterArray } from "@plane/utils";
import { createFilterUpdateHandler } from "@/components/core/sidebar/progress-stats/shared";
import { useSemecProjectPanel } from "@/hooks/store/semec/use-semec-project-panel";
import { useWorkItemFilters } from "@/hooks/store/work-item-filters/use-work-item-filters";
import { getProgressKey } from "@/store/semec/project-panel.store";
import { SemecProgressChart } from "./progress-chart";
import { SemecProgressDistribution } from "./progress-distribution";
import { SemecPanelSection } from "./section";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const SemecProgressSection = observer(function SemecProgressSection(props: Props) {
  const { workspaceSlug, projectId } = props;
  const { t } = useTranslation();
  // store hooks
  const { progressMap, selectedModuleId, fetchProgress } = useSemecProjectPanel();
  const { getFilter, updateFilterValueFromSidebar } = useWorkItemFilters();
  // derived values
  const moduleId = selectedModuleId[projectId] ?? null;
  const progress = progressMap[getProgressKey(projectId, moduleId)];
  const filter = getFilter(EIssuesStoreType.PROJECT, projectId);
  const selectedIds = {
    assignee_id: toFilterArray(filter?.findFirstConditionByPropertyAndOperator("assignee_id", "in")?.value ?? []),
    label_id: toFilterArray(filter?.findFirstConditionByPropertyAndOperator("label_id", "in")?.value ?? []),
  } as Record<"assignee_id" | "label_id", string[]>;
  const selectedStateGroups = toFilterArray(
    filter?.findFirstConditionByPropertyAndOperator("state_group", "in")?.value ?? []
  ) as string[];

  // the whole-project progress is fetched by the panel root; a selected milestone has its own
  useSWR(
    moduleId ? `SEMEC_PROJECT_PROGRESS_${projectId}_${moduleId}` : null,
    () => fetchProgress(workspaceSlug, projectId, moduleId ?? undefined),
    { revalidateOnFocus: false }
  );

  if (!progress) return null;

  const updateFilter = (condition: Parameters<typeof updateFilterValueFromSidebar>[2]) =>
    updateFilterValueFromSidebar(EIssuesStoreType.PROJECT, projectId, condition);

  const toggle = (property: "assignee_id" | "label_id", id: string) =>
    createFilterUpdateHandler(property, selectedIds[property], updateFilter)(id);

  const stats: { key: "scope" | "started" | "completed"; color: string; groups: string[] }[] = [
    { key: "scope", color: "bg-[#9ca3af]", groups: [] },
    { key: "started", color: "bg-[#eab308]", groups: ["started"] },
    { key: "completed", color: "bg-[#6366f1]", groups: ["completed"] },
  ];
  const isStatActive = (groups: string[]) =>
    groups.length === selectedStateGroups.length && groups.every((group) => selectedStateGroups.includes(group));

  return (
    <SemecPanelSection title={t("semec.project_panel.progress")}>
      {progress.scope === 0 ? (
        <span className="px-1.5 py-1 text-13 text-tertiary">{t("semec.project_panel.no_work_items")}</span>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-1">
            {stats.map((stat) => (
              <button
                key={stat.key}
                type="button"
                aria-pressed={isStatActive(stat.groups)}
                className={cn("flex flex-col items-start rounded-sm px-1.5 py-1 hover:bg-layer-2", {
                  "bg-layer-2": isStatActive(stat.groups) && stat.groups.length > 0,
                })}
                onClick={() => updateFilter({ property: "state_group", operator: "in", value: stat.groups })}
              >
                <span className="flex items-center gap-1.5 text-12 text-tertiary">
                  <span className={cn("size-2 rounded-xs", stat.color)} />
                  {t(`semec.project_panel.${stat.key}`)}
                </span>
                <span className="text-16 font-semibold text-primary">{progress[stat.key]}</span>
              </button>
            ))}
          </div>
          <SemecProgressChart series={progress.series} targetDate={progress.target_date} />
          <SemecProgressDistribution progress={progress} selectedIds={selectedIds} onToggle={toggle} />
        </>
      )}
    </SemecPanelSection>
  );
});
