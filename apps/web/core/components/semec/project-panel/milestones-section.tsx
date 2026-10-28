/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { sortBy } from "lodash-es";
import { observer } from "mobx-react";
import useSWR from "swr";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IModule } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { CreateUpdateModuleModal } from "@/components/modules/modal";
import { useModule } from "@/hooks/store/use-module";
import { useSemecProjectPanel } from "@/hooks/store/semec/use-semec-project-panel";
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkItemFilters } from "@/hooks/store/work-item-filters/use-work-item-filters";
import { getProgressKey } from "@/store/semec/project-panel.store";
import { SemecMilestoneRow } from "./milestone-row";
import { SemecPanelSection } from "./section";

// Milestones with a target date first (soonest first), then the rest by name
export const sortMilestones = (modules: IModule[]) =>
  sortBy(modules, [
    (module) => !module.target_date,
    (module) => module.target_date ?? "",
    (module) => module.name.toLowerCase(),
  ]);

type Props = {
  workspaceSlug: string;
  projectId: string;
  onChanged: () => void;
};

export const SemecMilestonesSection = observer(function SemecMilestonesSection(props: Props) {
  const { workspaceSlug, projectId, onChanged } = props;
  const { t } = useTranslation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  // store hooks
  const { fetchModules, getProjectModuleIds, getModuleById } = useModule();
  const { progressMap, selectedModuleId, setSelectedModule } = useSemecProjectPanel();
  const { updateFilterValueFromSidebar } = useWorkItemFilters();
  const { allowPermissions } = useUserPermissions();

  useSWR(`SEMEC_PROJECT_MODULES_${projectId}`, () => fetchModules(workspaceSlug, projectId), {
    revalidateOnFocus: false,
  });

  // derived values
  const modules = sortMilestones(
    (getProjectModuleIds(projectId) ?? [])
      .map((moduleId) => getModuleById(moduleId))
      .filter((module): module is IModule => !!module && !module.archived_at)
  );
  const selected = selectedModuleId[projectId] ?? null;
  const noMilestone = progressMap[getProgressKey(projectId)]?.no_milestone;
  const canCreate = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  const handleSelect = (moduleId: string) => {
    const next = selected === moduleId ? null : moduleId;
    setSelectedModule(projectId, next);
    updateFilterValueFromSidebar(EIssuesStoreType.PROJECT, projectId, {
      property: "module_id",
      operator: "in",
      value: next ? [next] : [],
    });
  };

  return (
    <SemecPanelSection
      title={t("semec.project_panel.milestones")}
      onAdd={canCreate ? () => setIsCreateOpen(true) : undefined}
      addLabel={t("semec.project_panel.add_milestone")}
    >
      {modules.length === 0 && (
        <span className="px-1.5 py-1 text-13 text-tertiary">{t("semec.project_panel.no_milestones")}</span>
      )}
      {modules.map((module) => (
        <SemecMilestoneRow
          key={module.id}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          module={module}
          isSelected={selected === module.id}
          onSelect={handleSelect}
        />
      ))}
      {noMilestone !== undefined && noMilestone > 0 && (
        <div className="flex items-center gap-2 px-1.5 py-1 text-13 text-tertiary">
          <span className="size-3.5 flex-shrink-0 rounded-full border border-dashed border-strong" />
          <span>{t("semec.project_panel.no_milestone")}</span>
          <span className="ml-auto text-12">{noMilestone}</span>
        </div>
      )}
      <CreateUpdateModuleModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          onChanged();
        }}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
      />
    </SemecPanelSection>
  );
});
