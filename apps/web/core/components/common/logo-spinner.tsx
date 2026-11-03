/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { SemecEmblem } from "@plane/propel/icons";

// SEMEC: the SEMEC symbol with a soft pulse (off with reduced motion) replaces Plane's GIFs.
// Decorative: a fixed label would be in one language only, before translations load.
export function LogoSpinner() {
  return (
    <div className="flex items-center justify-center">
      <SemecEmblem className="semec-pulse h-6 w-auto sm:h-11" />
    </div>
  );
}
