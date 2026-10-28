/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TProjectOrderByOptions =
  | "sort_order"
  | "name"
  | "-name"
  | "created_at"
  | "-created_at"
  | "members_length"
  | "-members_length"
  // SEMEC: project properties from the semec app
  | "semec_target_date"
  | "-semec_target_date"
  | "semec_start_date"
  | "-semec_start_date"
  | "semec_priority"
  | "-semec_priority"
  | "semec_status"
  | "-semec_status";

export type TProjectDisplayFilters = {
  my_projects?: boolean;
  archived_projects?: boolean;
  order_by?: TProjectOrderByOptions;
};

export type TProjectAppliedDisplayFilterKeys = "my_projects" | "archived_projects";

export type TProjectFilters = {
  access?: string[] | null;
  lead?: string[] | null;
  members?: string[] | null;
  created_at?: string[] | null;
  // SEMEC: project properties from the semec app
  semec_status?: string[] | null;
  semec_priority?: string[] | null;
};

export type TProjectStoredFilters = {
  display_filters?: TProjectDisplayFilters;
  filters?: TProjectFilters;
};
