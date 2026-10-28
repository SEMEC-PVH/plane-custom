/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { TSemecProjectActivity, TSemecProjectPriority, TSemecProjectStatus } from "@plane/types";
import { Avatar } from "@plane/ui";
import { getFileURL, renderFormattedDate } from "@plane/utils";
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";
import { getSemecPriorityI18nKey, getSemecStatusI18nKey } from "./constants";

type Props = {
  activity: TSemecProjectActivity;
};

export const SemecActivityItem = observer(function SemecActivityItem(props: Props) {
  const { activity } = props;
  const { t } = useTranslation();
  const { getUserDetails } = useMember();
  const { getModuleById } = useModule();

  const actor = activity.actor?.display_name ?? t("semec.project_panel.activity_item.someone");
  const none = t("semec.project_panel.activity_item.none");
  const date = (value: string | null) => (value ? (renderFormattedDate(value) ?? value) : none);
  const milestoneName =
    activity.verb === "deleted"
      ? activity.old_value
      : activity.field === "milestone.target_date"
        ? (getModuleById(activity.module_id ?? "")?.name ?? t("semec.project_panel.activity_item.a_milestone"))
        : activity.new_value;

  const describe = (): string => {
    const key = "semec.project_panel.activity_item";
    switch (activity.field) {
      case "milestone":
        return t(`${key}.${activity.verb === "deleted" ? "milestone_deleted" : "milestone_created"}`, {
          actor,
          name: milestoneName,
        });
      case "milestone.name":
        return t(`${key}.milestone_renamed`, { actor, old: activity.old_value, name: activity.new_value });
      case "milestone.target_date":
        return t(`${key}.milestone_target_date`, { actor, name: milestoneName, value: date(activity.new_value) });
      case "status":
        return t(`${key}.status`, {
          actor,
          value: t(getSemecStatusI18nKey(activity.new_value as TSemecProjectStatus)),
        });
      case "priority":
        return t(`${key}.priority`, {
          actor,
          value: t(getSemecPriorityI18nKey(activity.new_value as TSemecProjectPriority)),
        });
      case "start_date":
      case "target_date":
        return t(`${key}.${activity.field}`, { actor, value: date(activity.new_value) });
      case "lead":
        return t(`${key}.lead`, {
          actor,
          value: activity.new_value ? (getUserDetails(activity.new_value)?.display_name ?? none) : none,
        });
      default:
        return "";
    }
  };

  return (
    <div className="flex items-start gap-2 px-1.5 py-1">
      <Avatar
        name={activity.actor?.display_name}
        src={getFileURL(activity.actor?.avatar_url ?? "")}
        size="sm"
        className="mt-0.5 flex-shrink-0"
      />
      <p className="min-w-0 flex-1 text-13 text-secondary">
        {describe()}
        <span className="text-tertiary"> · {renderFormattedDate(activity.created_at, "MMM d")}</span>
      </p>
    </div>
  );
});
