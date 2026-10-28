/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
import { ModuleStatusIcon, PriorityIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { renderFormattedDate } from "@plane/utils";
import { useSemecProjectPanel } from "@/hooks/store/semec/use-semec-project-panel";
import { getSemecPriorityI18nKey, getSemecStatusI18nKey } from "../project-panel/constants";

/** Loads the status/priority/dates/progress of every project the user can see, for the cards and filters. */
export const useSemecProjectSummaries = (workspaceSlug: string | undefined) => {
  const { fetchSummaries } = useSemecProjectPanel();
  useSWR(workspaceSlug ? `SEMEC_PROJECT_SUMMARIES_${workspaceSlug}` : null, () => fetchSummaries(workspaceSlug!), {
    revalidateOnFocus: false,
  });
};

type Props = {
  projectId: string;
};

export const SemecProjectCardProperties = observer(function SemecProjectCardProperties(props: Props) {
  const { projectId } = props;
  const { t } = useTranslation();
  const { summaryMap } = useSemecProjectPanel();
  const summary = summaryMap[projectId];

  if (!summary) return null;

  const hasDates = !!summary.start_date || !!summary.target_date;
  const showProgress = summary.scope !== null && summary.completed !== null && summary.scope > 0;
  const percent = showProgress ? Math.round((summary.completed! / summary.scope!) * 100) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5 text-11">
        <span className="flex items-center gap-1 rounded-sm bg-layer-2 px-1.5 py-0.5 text-secondary">
          <ModuleStatusIcon status={summary.status} height="12px" width="12px" />
          {t(getSemecStatusI18nKey(summary.status))}
        </span>
        {summary.priority !== "none" && (
          <span className="flex items-center gap-1 rounded-sm bg-layer-2 px-1.5 py-0.5 text-secondary">
            <PriorityIcon priority={summary.priority} size={12} />
            {t(getSemecPriorityI18nKey(summary.priority))}
          </span>
        )}
        {hasDates && (
          <span className="rounded-sm bg-layer-2 px-1.5 py-0.5 text-secondary">
            {summary.start_date ? renderFormattedDate(summary.start_date, "MMM d") : "…"} →{" "}
            {summary.target_date ? renderFormattedDate(summary.target_date, "MMM d") : "…"}
          </span>
        )}
      </div>
      {showProgress && (
        <Tooltip
          tooltipContent={t("semec.projects.progress", { completed: summary.completed, total: summary.scope })}
          position="top"
        >
          <div className="h-1 w-full overflow-hidden rounded-full bg-layer-2">
            <div className="h-full rounded-full bg-accent-primary" style={{ width: `${percent}%` }} />
          </div>
        </Tooltip>
      )}
    </div>
  );
});
