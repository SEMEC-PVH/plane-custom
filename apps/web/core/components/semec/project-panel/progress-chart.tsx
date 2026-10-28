/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { LineChart } from "@plane/propel/charts/line-chart";
import type { TChartData, TSemecProgressPoint } from "@plane/types";
import { renderFormattedDateWithoutYear } from "@plane/utils";

const PROJECTION_WINDOW = 14;

type TLineKey = "scope" | "started" | "completed" | "projection";

const line = (key: TLineKey, label: string, color: string, dashed = false) => ({
  key,
  label,
  stroke: color,
  fill: color,
  dashedLine: dashed,
  showDot: false,
  smoothCurves: false,
  style: dashed ? { strokeDasharray: "4 3" } : undefined,
});

const addDays = (isoDate: string, days: number) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/**
 * Projects completed work from the last point to the target date, at the average daily pace of the
 * last PROJECTION_WINDOW points, capped at the current scope. Empty when it cannot be drawn.
 */
export const buildProjection = (
  series: TSemecProgressPoint[],
  targetDate: string | null
): { date: string; completed: number }[] => {
  if (!targetDate || series.length < 2) return [];
  const last = series[series.length - 1];
  if (targetDate <= last.date) return [];
  const window = series.slice(-PROJECTION_WINDOW);
  const pace = (last.completed - window[0].completed) / (window.length - 1);
  if (pace <= 0) return [];

  const points = [{ date: last.date, completed: last.completed }];
  let date = last.date;
  while (date < targetDate) {
    date = addDays(date, 1);
    const completed = Math.min(last.scope, last.completed + pace * points.length);
    points.push({ date, completed: Math.round(completed * 10) / 10 });
  }
  return points;
};

type Props = {
  series: TSemecProgressPoint[];
  targetDate: string | null;
};

export function SemecProgressChart(props: Props) {
  const { series, targetDate } = props;
  const { t } = useTranslation();

  if (series.length < 2) return null;

  const projection = new Map(buildProjection(series, targetDate).map((point) => [point.date, point.completed]));
  const lastDate = series[series.length - 1].date;
  const dates = [...series.map((point) => point.date), ...[...projection.keys()].filter((date) => date > lastDate)];
  const byDate = new Map(series.map((point) => [point.date, point]));
  const data: TChartData<"name", TLineKey>[] = dates.map((date) => {
    const point = byDate.get(date);
    return {
      name: renderFormattedDateWithoutYear(date),
      scope: point?.scope ?? null,
      started: point?.started ?? null,
      completed: point?.completed ?? null,
      projection: projection.get(date) ?? null,
    };
  });

  return (
    <LineChart
      data={data}
      lines={[
        line("scope", t("semec.project_panel.scope"), "#9ca3af"),
        line("started", t("semec.project_panel.started"), "#eab308"),
        line("completed", t("semec.project_panel.completed"), "#6366f1"),
        line("projection", t("semec.project_panel.completed"), "#6366f1", true),
      ]}
      xAxis={{ key: "name" }}
      yAxis={{ key: "scope", allowDecimals: false }}
      margin={{ top: 8, right: 8, bottom: 0, left: -24 }}
      className="h-40 w-full"
      showTooltip
    />
  );
}
