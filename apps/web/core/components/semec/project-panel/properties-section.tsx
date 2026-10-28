/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { SquareUser } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ModuleStatusIcon, PlusIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TSemecProjectProperties, TSemecProjectStatus } from "@plane/types";
import { Avatar, AvatarGroup, CustomSelect } from "@plane/ui";
import { getDate, getFileURL, renderFormattedPayloadDate } from "@plane/utils";
import { DateRangeDropdown } from "@/components/dropdowns/date-range";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { SendProjectInvitationModal } from "@/components/project/send-project-invitation-modal";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useSemecProjectPanel } from "@/hooks/store/semec/use-semec-project-panel";
import { useUserPermissions } from "@/hooks/store/user";
import { getSemecStatusColor, getSemecStatusI18nKey, SEMEC_PROJECT_STATUSES } from "./constants";
import { SemecPanelRow, SemecPanelSection } from "./section";

type Props = {
  workspaceSlug: string;
  projectId: string;
  onChanged: () => void;
};

export const SemecPropertiesSection = observer(function SemecPropertiesSection(props: Props) {
  const { workspaceSlug, projectId, onChanged } = props;
  const { t } = useTranslation();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  // store hooks
  const { propertiesMap, updateProperties } = useSemecProjectPanel();
  const { getProjectById, updateProject } = useProject();
  const { getUserDetails } = useMember();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const properties = propertiesMap[projectId];
  const project = getProjectById(projectId);
  const canEdit = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId);
  const leadId = typeof project?.project_lead === "string" ? project.project_lead : (project?.project_lead?.id ?? null);
  const memberIds = project?.members ?? [];

  if (!properties) return null;

  const save = async (data: Partial<TSemecProjectProperties>) => {
    try {
      await updateProperties(workspaceSlug, projectId, data);
      onChanged();
    } catch (error) {
      const isDateError = !!(error as Record<string, unknown> | undefined)?.target_date;
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("semec.project_panel.save_error"),
        message: isDateError ? t("semec.project_panel.dates_error") : undefined,
      });
    }
  };

  const saveLead = async (memberId: string | null) => {
    try {
      await updateProject(workspaceSlug, projectId, { project_lead: memberId });
      onChanged();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("semec.project_panel.save_error") });
    }
  };

  return (
    <SemecPanelSection title={t("semec.project_panel.properties")}>
      <SemecPanelRow label={t("semec.project_panel.status")}>
        <CustomSelect
          value={properties.status}
          onChange={(status: TSemecProjectStatus) => void save({ status })}
          disabled={!canEdit}
          customButton={
            <span className="flex items-center gap-1.5 text-13 text-primary">
              <ModuleStatusIcon status={properties.status} height="14px" width="14px" />
              {t(getSemecStatusI18nKey(properties.status))}
            </span>
          }
        >
          {SEMEC_PROJECT_STATUSES.map((status) => (
            <CustomSelect.Option key={status} value={status}>
              <div className="flex items-center gap-2">
                <ModuleStatusIcon status={status} />
                <span style={{ color: getSemecStatusColor(status) }}>{t(getSemecStatusI18nKey(status))}</span>
              </div>
            </CustomSelect.Option>
          ))}
        </CustomSelect>
      </SemecPanelRow>

      <SemecPanelRow label={t("semec.project_panel.priority")}>
        <div className="h-7">
          <PriorityDropdown
            value={properties.priority}
            onChange={(priority) => void save({ priority })}
            buttonVariant="transparent-with-text"
            disabled={!canEdit}
          />
        </div>
      </SemecPanelRow>

      <SemecPanelRow label={t("semec.project_panel.lead")}>
        <div className="h-7">
          <MemberDropdown
            value={leadId}
            onChange={(memberId) => void saveLead(memberId)}
            projectId={projectId}
            multiple={false}
            buttonVariant="transparent-with-text"
            placeholder={t("semec.project_panel.no_lead")}
            disabled={!isAdmin}
            icon={SquareUser}
          />
        </div>
      </SemecPanelRow>

      <SemecPanelRow label={t("semec.project_panel.members")}>
        <div className="flex items-center gap-2">
          {memberIds.length > 0 && (
            <AvatarGroup showTooltip>
              {memberIds.map((memberId) => {
                const member = getUserDetails(memberId);
                if (!member) return null;
                return <Avatar key={member.id} name={member.display_name} src={getFileURL(member.avatar_url)} />;
              })}
            </AvatarGroup>
          )}
          {isAdmin && (
            <button
              type="button"
              className="flex items-center gap-1 text-13 text-tertiary hover:text-primary"
              onClick={() => setIsInviteOpen(true)}
            >
              <PlusIcon className="size-3.5" />
              {memberIds.length === 0 && t("semec.project_panel.add_members")}
            </button>
          )}
        </div>
        <SendProjectInvitationModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          projectId={projectId}
          workspaceSlug={workspaceSlug}
        />
      </SemecPanelRow>

      <SemecPanelRow label={t("semec.project_panel.dates")}>
        <div className="h-7">
          <DateRangeDropdown
            buttonVariant="transparent-with-text"
            value={{ from: getDate(properties.start_date), to: getDate(properties.target_date) }}
            onSelect={(range) =>
              void save({
                start_date: range?.from ? (renderFormattedPayloadDate(range.from) ?? null) : null,
                target_date: range?.to ? (renderFormattedPayloadDate(range.to) ?? null) : null,
              })
            }
            placeholder={{
              from: t("semec.project_panel.start_date"),
              to: t("semec.project_panel.target_date"),
            }}
            disabled={!canEdit}
          />
        </div>
      </SemecPanelRow>
    </SemecPanelSection>
  );
});
