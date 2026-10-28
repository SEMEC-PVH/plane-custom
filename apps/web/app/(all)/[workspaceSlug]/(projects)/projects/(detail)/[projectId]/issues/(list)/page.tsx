/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// i18n
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { ProjectLayoutRoot } from "@/components/issues/issue-layouts/roots/project-layout-root";
import { SemecProjectPanel } from "@/components/semec/project-panel/root";
import { useSemecProjectPanelOpen } from "@/components/semec/project-panel/toggle-button";
// hooks
import { useProject } from "@/hooks/store/use-project";
import type { Route } from "./+types/page";

function ProjectIssuesPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  // i18n
  const { t } = useTranslation();
  // store
  const { getProjectById } = useProject();
  const { isOpen: isSemecPanelOpen } = useSemecProjectPanelOpen();

  // derived values
  const project = getProjectById(projectId);
  const pageTitle = project?.name ? `${project?.name} - ${t("issue.label", { count: 2 })}` : undefined; // Count is for pluralization

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="relative flex h-full w-full">
        <div className="h-full w-full overflow-hidden">
          <ProjectLayoutRoot />
        </div>
        {isSemecPanelOpen && (
          <div className="vertical-scrollbar absolute right-0 z-13 flex scrollbar-sm h-full w-[24rem] flex-shrink-0 flex-col overflow-y-auto border-l border-subtle bg-surface-1 px-4 shadow-raised-200">
            <SemecProjectPanel workspaceSlug={workspaceSlug} projectId={projectId} />
          </div>
        )}
      </div>
    </>
  );
}

export default observer(ProjectIssuesPage);
