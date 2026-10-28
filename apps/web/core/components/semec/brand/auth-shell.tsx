/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { useTranslation } from "@plane/i18n";
import { SemecLockup } from "@plane/propel/icons";
import { SemecPortoVelhoArt } from "./porto-velho-art";

const SOURCE_CODE_URL = "https://github.com/SEMEC-PVH/plane-custom";

type TSemecAuthShell = {
  children: ReactNode;
  /** Draws the SEMEC lockup above the content (pages whose form has no lockup of its own). */
  showLockup?: boolean;
};

/** Layout of the sign-in and account pages: content, Porto Velho skyline and the AGPL source footer. */
export function SemecAuthShell({ children, showLockup = false }: TSemecAuthShell) {
  const { t } = useTranslation();

  return (
    <div className="semec-auth relative z-10 flex h-screen w-screen flex-col items-center overflow-hidden overflow-y-auto px-8 pt-6 pb-10">
      <div className="semec-auth-content relative z-[1] flex w-full flex-grow flex-col items-center">
        {showLockup && (
          <div className="mt-10 flex justify-center">
            <SemecLockup height={64} />
          </div>
        )}
        {children}
      </div>
      <div className="semec-auth-art">
        <SemecPortoVelhoArt />
      </div>
      <footer className="absolute right-0 bottom-3.5 left-0 z-[1] px-4 text-center text-12 text-tertiary">
        {t("semec.auth.footer")}{" "}
        <a href={SOURCE_CODE_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          {t("semec.auth.source_code")}
        </a>
        .
      </footer>
    </div>
  );
}
