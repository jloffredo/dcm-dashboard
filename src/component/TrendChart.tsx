import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { DateRange } from "../helper/dateRangeHelper.ts";
import RecordListModal, { type Column } from "./RecordListModal.tsx";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SERIES_COLORS = [
  "rgba(54, 162, 235, 0.7)",
  "rgba(255, 99, 132, 0.7)",
  "rgba(255, 206, 86, 0.7)",
  "rgba(75, 192, 192, 0.7)",
  "rgba(153, 102, 255, 0.7)",
  "rgba(255, 159, 64, 0.7)",
];

// "YYYY-MM-DD" is parsed by `new Date()` as UTC midnight; reading it back with local
// getters (as bucketing does) would shift the date outside UTC, so build it from local parts.
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

type Granularity = "day" | "week" | "month";

function getGranularity(from: Date, to: Date): Granularity {
  const days = (to.getTime() - from.getTime()) / 86_400_000;
  if (days <= 31) return "day";
  if (days <= 120) return "week";
  return "month";
}

function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return d;
}

function bucketKey(date: Date, granularity: Granularity): string {
  if (granularity === "month") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  const d = granularity === "week" ? startOfWeek(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function bucketLabel(key: string, granularity: Granularity): string {
  if (granularity === "month") {
    const [year, month] = key.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
  }
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function generateBucketKeys(from: Date, to: Date, granularity: Granularity): string[] {
  const cursor =
    granularity === "month"
      ? new Date(from.getFullYear(), from.getMonth(), 1)
      : granularity === "week"
        ? startOfWeek(from)
        : new Date(from.getFullYear(), from.getMonth(), from.getDate());

  const keys: string[] = [];
  while (cursor <= to) {
    keys.push(bucketKey(cursor, granularity));
    if (granularity === "day") cursor.setDate(cursor.getDate() + 1);
    else if (granularity === "week") cursor.setDate(cursor.getDate() + 7);
    else cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
}

interface TrendChartProps<T> {
  items: T[];
  dateRange: DateRange;
  getDate: (item: T) => string | undefined;
  getSeries?: (item: T) => string | undefined;
  label: string;
  columns: Column<T>[];
}

function TrendChart<T>({ items, dateRange, getDate, getSeries, label, columns }: TrendChartProps<T>) {
  const [selectedBucket, setSelectedBucket] = useState<{
    key: string;
    seriesName?: string;
  } | null>(null);

  const from = parseLocalDate(dateRange.from);
  const to = parseLocalDate(dateRange.to);
  const granularity = getGranularity(from, to);
  const bucketKeys = generateBucketKeys(from, to, granularity);
  const bucketIndex = new Map(bucketKeys.map((key, i) => [key, i]));

  const seriesNames = getSeries
    ? Array.from(new Set(items.map((item) => getSeries(item) || "Unknown"))).sort()
    : [label];

  const seriesCounts = new Map(seriesNames.map((name) => [name, new Array(bucketKeys.length).fill(0)]));

  let totalCount = 0;
  for (const item of items) {
    const dateValue = getDate(item);
    if (!dateValue) continue;
    const index = bucketIndex.get(bucketKey(new Date(dateValue), granularity));
    if (index === undefined) continue;
    const seriesName = getSeries ? getSeries(item) || "Unknown" : label;
    seriesCounts.get(seriesName)![index] += 1;
    totalCount += 1;
  }

  if (!totalCount) return <p>No data</p>;

  const data: ChartData<"bar", number[], string> = {
    labels: bucketKeys.map((key) => bucketLabel(key, granularity)),
    datasets: seriesNames.map((name, i) => ({
      label: name,
      data: seriesCounts.get(name)!,
      backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length],
    })),
  };

  const stacked = Boolean(getSeries);
  const options: ChartOptions<"bar"> = {
    plugins: {
      title: { display: true, text: label, font: { size: 16 } },
      legend: { display: stacked },
    },
    scales: {
      x: { stacked },
      y: { stacked, beginAtZero: true, ticks: { precision: 0 } },
    },
    onClick: (_event, elements) => {
      if (!elements.length) return;
      const { index, datasetIndex } = elements[0];
      setSelectedBucket({
        key: bucketKeys[index],
        seriesName: getSeries ? seriesNames[datasetIndex] : undefined,
      });
    },
  };

  const matchingItems = selectedBucket
    ? items.filter((item) => {
        const dateValue = getDate(item);
        if (!dateValue) return false;
        if (bucketKey(new Date(dateValue), granularity) !== selectedBucket.key) return false;
        if (selectedBucket.seriesName && getSeries) {
          return (getSeries(item) || "Unknown") === selectedBucket.seriesName;
        }
        return true;
      })
    : [];

  return (
    <>
      <Bar data={data} options={options} />
      {selectedBucket && (
        <RecordListModal
          title={`${bucketLabel(selectedBucket.key, granularity)}${
            selectedBucket.seriesName ? ` — ${selectedBucket.seriesName}` : ""
          } (${matchingItems.length})`}
          items={matchingItems}
          columns={columns}
          onClose={() => setSelectedBucket(null)}
        />
      )}
    </>
  );
}

export default TrendChart;
