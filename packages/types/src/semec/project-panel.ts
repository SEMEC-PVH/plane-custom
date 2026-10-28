/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TSemecProjectStatus = "backlog" | "planned" | "in-progress" | "paused" | "completed" | "cancelled";

export type TSemecProjectPriority = "urgent" | "high" | "medium" | "low" | "none";

export type TSemecProjectProperties = {
  project_id: string;
  status: TSemecProjectStatus;
  priority: TSemecProjectPriority;
  start_date: string | null;
  target_date: string | null;
};

export type TSemecAssigneeProgress = {
  assignee_id: string | null;
  display_name: string | null;
  avatar_url: string | null;
  total: number;
  completed: number;
};

export type TSemecLabelProgress = {
  label_id: string | null;
  name: string | null;
  color: string | null;
  total: number;
  completed: number;
};

export type TSemecProgressPoint = {
  date: string;
  scope: number;
  started: number;
  completed: number;
};

export type TSemecProjectProgress = {
  scope: number;
  started: number;
  completed: number;
  no_milestone: number;
  assignees: TSemecAssigneeProgress[];
  labels: TSemecLabelProgress[];
  series: TSemecProgressPoint[];
  start_date: string | null;
  target_date: string | null;
};

export type TSemecProjectActivityField =
  | "milestone"
  | "milestone.name"
  | "milestone.target_date"
  | "status"
  | "priority"
  | "start_date"
  | "target_date"
  | "lead";

export type TSemecProjectActivity = {
  id: string;
  created_at: string;
  actor: { id: string; display_name: string; avatar_url: string | null } | null;
  verb: "created" | "updated" | "deleted";
  field: TSemecProjectActivityField;
  old_value: string | null;
  new_value: string | null;
  module_id: string | null;
};

export type TSemecProjectSummary = {
  project_id: string;
  status: TSemecProjectStatus;
  priority: TSemecProjectPriority;
  start_date: string | null;
  target_date: string | null;
  // null when the user is a guest of a project that hides its features from guests
  scope: number | null;
  completed: number | null;
};
