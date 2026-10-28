/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
import { EModalWidth, ModalCore } from "@plane/ui";
import { useSemecProjectPanel } from "@/hooks/store/semec/use-semec-project-panel";
import { SemecProjectPanelService } from "@/services/semec/project-panel.service";
import { SemecActivityItem } from "./activity-item";
import { SemecPanelSection } from "./section";

export const SEMEC_ACTIVITY_PREVIEW = 5;

const semecService = new SemecProjectPanelService();

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const SemecActivitySection = observer(function SemecActivitySection(props: Props) {
  const { workspaceSlug, projectId } = props;
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { activityMap } = useSemecProjectPanel();
  // the preview is fetched (and refreshed after edits) by the panel root
  const activity = activityMap[projectId] ?? [];

  const { data: fullActivity } = useSWR(
    isModalOpen ? `SEMEC_PROJECT_ACTIVITY_ALL_${projectId}` : null,
    () => semecService.getActivity(workspaceSlug, projectId),
    { revalidateOnFocus: false }
  );

  return (
    <SemecPanelSection title={t("semec.project_panel.activity")}>
      {activity.length === 0 && (
        <span className="px-1.5 py-1 text-13 text-tertiary">{t("semec.project_panel.no_activity")}</span>
      )}
      {activity.map((item) => (
        <SemecActivityItem key={item.id} activity={item} />
      ))}
      {activity.length >= SEMEC_ACTIVITY_PREVIEW && (
        <button
          type="button"
          className="self-start px-1.5 py-1 text-12 text-accent-primary hover:underline"
          onClick={() => setIsModalOpen(true)}
        >
          {t("semec.project_panel.see_all")}
        </button>
      )}
      <ModalCore isOpen={isModalOpen} handleClose={() => setIsModalOpen(false)} width={EModalWidth.XL}>
        <div className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto p-4">
          <h3 className="mb-2 text-16 font-medium text-primary">{t("semec.project_panel.activity")}</h3>
          {(fullActivity ?? activity).map((item) => (
            <SemecActivityItem key={item.id} activity={item} />
          ))}
        </div>
      </ModalCore>
    </SemecPanelSection>
  );
});
