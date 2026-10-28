/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { CloseIcon, ModuleStatusIcon, PriorityIcon } from "@plane/propel/icons";
import type { TSemecProjectPriority, TSemecProjectStatus } from "@plane/types";
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";
import {
  getSemecPriorityI18nKey,
  getSemecStatusI18nKey,
  SEMEC_PROJECT_PRIORITIES,
  SEMEC_PROJECT_STATUSES,
} from "../project-panel/constants";

type FilterProps = {
  appliedFilters: string[] | null;
  handleUpdate: (value: string) => void;
  searchQuery: string;
};

function SemecFilterSection(
  props: FilterProps & { title: string; options: { value: string; label: string; icon: React.ReactNode }[] }
) {
  const { appliedFilters, handleUpdate, searchQuery, title, options } = props;
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const appliedCount = appliedFilters?.length ?? 0;
  const visible = options.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      <FilterHeader
        title={`${title}${appliedCount > 0 ? ` (${appliedCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {visible.map((option) => (
            <FilterOption
              key={option.value}
              isChecked={!!appliedFilters?.includes(option.value)}
              onClick={() => handleUpdate(option.value)}
              icon={option.icon}
              title={option.label}
            />
          ))}
        </div>
      )}
    </>
  );
}

export const SemecFilterStatus = observer(function SemecFilterStatus(props: FilterProps) {
  const { t } = useTranslation();
  return (
    <SemecFilterSection
      {...props}
      title={t("semec.projects.status")}
      options={SEMEC_PROJECT_STATUSES.map((status) => ({
        value: status,
        label: t(getSemecStatusI18nKey(status)),
        icon: <ModuleStatusIcon status={status} />,
      }))}
    />
  );
});

export const SemecFilterPriority = observer(function SemecFilterPriority(props: FilterProps) {
  const { t } = useTranslation();
  return (
    <SemecFilterSection
      {...props}
      title={t("semec.projects.priority")}
      options={SEMEC_PROJECT_PRIORITIES.map((priority) => ({
        value: priority,
        label: t(getSemecPriorityI18nKey(priority)),
        icon: <PriorityIcon priority={priority} size={12} />,
      }))}
    />
  );
});

type AppliedProps = {
  filterKey: "semec_status" | "semec_priority";
  values: string[];
  editable: boolean | undefined;
  handleRemove: (value: string) => void;
};

/** Chips for the applied SEMEC filters in the projects header */
export const SemecAppliedProjectFilters = observer(function SemecAppliedProjectFilters(props: AppliedProps) {
  const { filterKey, values, editable, handleRemove } = props;
  const { t } = useTranslation();
  const label = (value: string) =>
    t(
      filterKey === "semec_status"
        ? getSemecStatusI18nKey(value as TSemecProjectStatus)
        : getSemecPriorityI18nKey(value as TSemecProjectPriority)
    );

  return (
    <>
      {values.map((value) => (
        <div key={value} className="flex items-center gap-1 rounded-sm bg-layer-1 p-1 text-11">
          {label(value)}
          {editable && (
            <button
              type="button"
              className="grid place-items-center text-tertiary hover:text-secondary"
              onClick={() => handleRemove(value)}
            >
              <CloseIcon height={10} width={10} strokeWidth={2} />
            </button>
          )}
        </div>
      ))}
    </>
  );
});
