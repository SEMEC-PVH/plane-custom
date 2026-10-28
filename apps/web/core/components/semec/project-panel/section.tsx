/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronDownIcon, ChevronRightIcon, PlusIcon } from "@plane/propel/icons";

type Props = {
  title: string;
  children: ReactNode;
  onAdd?: () => void;
  addLabel?: string;
};

export function SemecPanelSection(props: Props) {
  const { title, children, onAdd, addLabel } = props;
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className="rounded-md border border-subtle bg-layer-1 px-3 py-2.5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-1 text-13 font-medium text-secondary hover:text-primary"
          onClick={() => setIsOpen((open) => !open)}
        >
          {title}
          {isOpen ? <ChevronDownIcon className="size-3.5" /> : <ChevronRightIcon className="size-3.5" />}
        </button>
        {onAdd && (
          <button
            type="button"
            aria-label={addLabel}
            className="grid size-5 place-items-center rounded-sm text-tertiary hover:bg-layer-2 hover:text-primary"
            onClick={onAdd}
          >
            <PlusIcon className="size-3.5" />
          </button>
        )}
      </div>
      {isOpen && <div className="mt-2 flex flex-col gap-1">{children}</div>}
    </section>
  );
}

type RowProps = {
  label: string;
  children: ReactNode;
};

export function SemecPanelRow(props: RowProps) {
  const { label, children } = props;
  return (
    <div className="flex min-h-7 items-center gap-2">
      <span className="w-24 flex-shrink-0 truncate text-13 text-tertiary">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
