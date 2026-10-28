/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

export type TSemecEmblemProps = {
  height?: number | string;
  className?: string;
  /** Accessible name; without it the symbol is decorative. */
  title?: string;
};

const EMBLEM_RATIO = 82 / 68;

/** SEMEC symbol (green, yellow and blue house), always in its original colors. */
export function SemecEmblem({ height, className, title }: TSemecEmblemProps) {
  const h = height === undefined ? undefined : Number(height) || undefined;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="220 16 82 68"
      height={h}
      width={h === undefined ? undefined : h * EMBLEM_RATIO}
      className={className}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
    >
      <path
        fill="#6BC056"
        d="M260.654 18.7713L280.526 28.936L274.882 28.9467L275.021 81.7375C274.804 81.8273 274.586 81.9167 274.374 82.0191C265.273 86.4201 255.399 86.095 246.397 81.6492L246.386 28.9586L240.901 28.9593L260.654 18.7713Z"
      />
      <path
        fill="#FDDF10"
        d="M224.012 41.9028L244.879 31.0498L244.801 80.6211C244.453 80.3947 244.098 80.1809 243.752 79.9531C235.647 74.6187 230.642 64.7601 230.363 55.2502C230.233 50.819 230.409 46.3834 230.289 41.9519L224.012 41.9028Z"
      />
      <path
        fill="#1E459B"
        d="M277.015 31.1847L297.938 41.8827L291.377 41.8404C291.324 50.0211 292.067 59.0581 288.835 66.6483C286.11 73.0449 282.326 76.7835 276.999 80.5378L277.015 31.1847Z"
      />
    </svg>
  );
}
