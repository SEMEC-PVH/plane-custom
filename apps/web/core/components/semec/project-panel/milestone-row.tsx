/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useId, useRef } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { IModule } from "@plane/types";
import { cn, renderFormattedDate } from "@plane/utils";
import { ModuleQuickActions } from "@/components/modules/quick-actions";

export const getCompletionPercent = (completed: number, total: number) =>
  total > 0 ? Math.round((completed / total) * 100) : 0;

type DiamondProps = { percent: number };

// Diamond filled from the bottom up to the completion percentage, as in Linear
function ProgressDiamond({ percent }: DiamondProps) {
  const clipId = useId();
  const color = percent >= 100 ? "var(--color-success-primary, #16a34a)" : "var(--color-danger-primary, #e11d48)";
  const fillHeight = (Math.min(percent, 100) / 100) * 12;
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="flex-shrink-0">
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y={13 - fillHeight} width="14" height={fillHeight + 1} />
        </clipPath>
      </defs>
      <path d="M7 1 L13 7 L7 13 L1 7 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M7 1 L13 7 L7 13 L1 7 Z" fill={color} clipPath={`url(#${clipId})`} />
    </svg>
  );
}

type Props = {
  workspaceSlug: string;
  projectId: string;
  module: IModule;
  isSelected: boolean;
  onSelect: (moduleId: string) => void;
};

export const SemecMilestoneRow = observer(function SemecMilestoneRow(props: Props) {
  const { workspaceSlug, projectId, module, isSelected, onSelect } = props;
  const { t } = useTranslation();
  const parentRef = useRef<HTMLDivElement>(null);
  // cancelled items are out of scope, as in the Progress section
  const total = module.total_issues - module.cancelled_issues;
  const percent = getCompletionPercent(module.completed_issues, total);

  return (
    <div
      ref={parentRef}
      className={cn("group flex items-center gap-2 rounded-sm px-1.5 py-1 hover:bg-layer-2", {
        "bg-layer-2 ring-1 ring-accent-strong": isSelected,
      })}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
        onClick={() => onSelect(module.id)}
        aria-pressed={isSelected}
      >
        <ProgressDiamond percent={percent} />
        <span className="min-w-0 flex-1 truncate text-13 text-primary">{module.name}</span>
        <span className="flex-shrink-0 text-12 text-tertiary">
          {t("semec.project_panel.milestone_progress", { percent, total })}
        </span>
        <span className="w-12 flex-shrink-0 text-right text-12 text-secondary">
          {module.target_date ? renderFormattedDate(module.target_date, "MMM d") : ""}
        </span>
      </button>
      <ModuleQuickActions
        parentRef={parentRef}
        moduleId={module.id}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
        customClassName="flex-shrink-0 flex items-center justify-center rounded-sm size-5 text-tertiary hover:text-primary"
      />
    </div>
  );
});
