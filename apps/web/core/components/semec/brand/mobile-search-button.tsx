/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
import { SearchIcon } from "@plane/propel/icons";
import { usePowerK } from "@/hooks/store/use-power-k";

/** On narrow screens the top bar search box does not fit; this opens the same commands as a modal. */
export function SemecMobileSearchButton() {
  const { t } = useTranslation();
  const { togglePowerKModal } = usePowerK();

  return (
    <IconButton
      variant="tertiary"
      size="lg"
      icon={SearchIcon}
      aria-label={t("search")}
      onClick={() => togglePowerKModal(true)}
    />
  );
}
