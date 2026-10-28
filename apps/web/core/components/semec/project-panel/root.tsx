/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { useSemecProjectPanel } from "@/hooks/store/semec/use-semec-project-panel";
import { SEMEC_ACTIVITY_PREVIEW, SemecActivitySection } from "./activity-section";
import { SemecMilestonesSection } from "./milestones-section";
import { SemecProgressSection } from "./progress-section";
import { SemecPropertiesSection } from "./properties-section";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const SemecProjectPanel = observer(function SemecProjectPanel(props: Props) {
  const { workspaceSlug, projectId } = props;
  const { fetchProperties, fetchProgress, fetchActivity } = useSemecProjectPanel();

  useSWR(`SEMEC_PROJECT_PROPERTIES_${projectId}`, () => fetchProperties(workspaceSlug, projectId), {
    revalidateOnFocus: false,
  });
  // whole-project progress: also feeds the "No milestone" count
  const { mutate: refreshProgress } = useSWR(
    `SEMEC_PROJECT_PROGRESS_${projectId}`,
    () => fetchProgress(workspaceSlug, projectId),
    { revalidateOnFocus: false }
  );
  const { mutate: refreshActivity } = useSWR(
    `SEMEC_PROJECT_ACTIVITY_${projectId}`,
    () => fetchActivity(workspaceSlug, projectId, SEMEC_ACTIVITY_PREVIEW),
    { revalidateOnFocus: false }
  );

  // Sections call this after an edit so the other sections refresh
  const handleChanged = useCallback(() => {
    void refreshProgress();
    void refreshActivity();
  }, [refreshProgress, refreshActivity]);

  return (
    <div className="flex flex-col gap-3 py-4">
      <SemecPropertiesSection workspaceSlug={workspaceSlug} projectId={projectId} onChanged={handleChanged} />
      <SemecMilestonesSection workspaceSlug={workspaceSlug} projectId={projectId} onChanged={handleChanged} />
      <SemecProgressSection workspaceSlug={workspaceSlug} projectId={projectId} />
      <SemecActivitySection workspaceSlug={workspaceSlug} projectId={projectId} />
    </div>
  );
});
