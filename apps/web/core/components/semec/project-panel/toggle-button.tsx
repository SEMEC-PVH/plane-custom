/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { PanelRight } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
import useLocalStorage from "@/hooks/use-local-storage";
import { SEMEC_PROJECT_PANEL_STORAGE_KEY } from "./constants";

export function useSemecProjectPanelOpen() {
  const { storedValue, setValue } = useLocalStorage(SEMEC_PROJECT_PANEL_STORAGE_KEY, "false");
  const isOpen = storedValue === "true";
  return { isOpen, toggle: () => setValue(`${!isOpen}`) };
}

export function SemecProjectPanelToggle() {
  const { t } = useTranslation();
  const { isOpen, toggle } = useSemecProjectPanelOpen();

  return (
    <Tooltip tooltipContent={t("semec.project_panel.toggle")} position="bottom">
      <IconButton
        variant="tertiary"
        size="lg"
        icon={PanelRight}
        aria-label={t("semec.project_panel.toggle")}
        onClick={toggle}
        className={cn({ "bg-accent-subtle text-accent-primary": isOpen })}
      />
    </Tooltip>
  );
}
