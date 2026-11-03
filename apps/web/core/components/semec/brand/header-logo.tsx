/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import Link from "next/link";
import { SemecEmblem, SemecLockup } from "@plane/propel/icons";

/** SEMEC lockup at the left of the top navigation bar; only the symbol on narrow screens. */
export function SemecHeaderLogo() {
  return (
    <Link href="/" className="mr-2 flex shrink-0 items-center border-r border-subtle pr-3">
      <SemecLockup height={32} className="hidden xl:block" />
      <SemecEmblem height={28} className="xl:hidden" title="SEMEC" />
    </Link>
  );
}
