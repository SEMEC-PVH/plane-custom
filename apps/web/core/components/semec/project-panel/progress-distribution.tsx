/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { TSemecProjectProgress, TWorkItemFilterProperty } from "@plane/types";
import { Avatar } from "@plane/ui";
import { cn, getFileURL } from "@plane/utils";
import { getCompletionPercent } from "./milestone-row";

type Row = {
  id: string | null;
  name: string;
  total: number;
  completed: number;
  icon: React.ReactNode;
};

type Props = {
  progress: TSemecProjectProgress;
  selectedIds: Partial<Record<TWorkItemFilterProperty, string[]>>;
  onToggle: (property: "assignee_id" | "label_id", id: string) => void;
};

export const SemecProgressDistribution = observer(function SemecProgressDistribution(props: Props) {
  const { progress, selectedIds, onToggle } = props;
  const { t } = useTranslation();
  const [tab, setTab] = useState<"assignee_id" | "label_id">("assignee_id");

  const rows: Row[] =
    tab === "assignee_id"
      ? progress.assignees.map((row) => ({
          id: row.assignee_id,
          name: row.display_name ?? t("semec.project_panel.no_assignee"),
          total: row.total,
          completed: row.completed,
          icon: <Avatar name={row.display_name ?? undefined} src={getFileURL(row.avatar_url ?? "")} size="sm" />,
        }))
      : progress.labels.map((row) => ({
          id: row.label_id,
          name: row.name ?? t("semec.project_panel.no_label"),
          total: row.total,
          completed: row.completed,
          icon: (
            <span
              className="size-2.5 flex-shrink-0 rounded-full border border-strong"
              style={{ backgroundColor: row.color ?? "transparent" }}
            />
          ),
        }));
  const selected = selectedIds[tab] ?? [];

  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-2 gap-1 rounded-md bg-layer-2 p-0.5">
        {(["assignee_id", "label_id"] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={cn("rounded-sm py-1 text-12 text-secondary", {
              "shadow-sm bg-layer-1 text-primary": tab === key,
            })}
            onClick={() => setTab(key)}
          >
            {t(key === "assignee_id" ? "semec.project_panel.assignees" : "semec.project_panel.labels")}
          </button>
        ))}
      </div>
      {rows.map((row) => {
        const content = (
          <>
            {row.icon}
            <span className="min-w-0 flex-1 truncate text-left text-13 text-primary">{row.name}</span>
            <span className="flex-shrink-0 text-12 text-tertiary">
              {t("semec.project_panel.milestone_progress", {
                percent: getCompletionPercent(row.completed, row.total),
                total: row.total,
              })}
            </span>
          </>
        );
        // rows without an id ("No assignee", "No label") only show the count: Plane's filters cannot match "empty"
        return row.id ? (
          <button
            key={row.id}
            type="button"
            aria-pressed={selected.includes(row.id)}
            className={cn("flex items-center gap-2 rounded-sm px-1.5 py-1 hover:bg-layer-2", {
              "bg-layer-2 ring-1 ring-accent-strong": selected.includes(row.id),
            })}
            onClick={() => onToggle(tab, row.id!)}
          >
            {content}
          </button>
        ) : (
          <div key="none" className="flex items-center gap-2 px-1.5 py-1 text-tertiary">
            {content}
          </div>
        );
      })}
    </div>
  );
});
