/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

import type { ISvgIcons } from "../type";
import { SemecEmblem } from "./semec";

// SEMEC: every Plane logo in the app shows the SEMEC symbol instead.
export function PlaneLogo({ height = "52", className }: ISvgIcons) {
  return <SemecEmblem height={height} className={className} />;
}
