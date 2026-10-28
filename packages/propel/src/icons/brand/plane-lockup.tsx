/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

import type { ISvgIcons } from "../type";
import { SemecLockup } from "./semec";

// SEMEC: every Plane lockup in the app shows the SEMEC lockup instead. Never below 28px tall, so
// "Secretaria Municipal de Economia" stays legible; the width follows the SEMEC proportions.
export function PlaneLockup({ height = "53", className }: ISvgIcons) {
  return (
    <SemecLockup
      height={Math.max(Number(height) || 28, 28)}
      className={className}
      onColor={className?.includes("text-on-color")}
    />
  );
}
