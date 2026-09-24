import { useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import RecordListModal, { type Column } from "./RecordListModal.tsx";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

// Beyond this many categories a pie's slices/legend become unreadable, so fall back to a bar chart.
const PIE_SLICE_LIMIT = 6;

const BACKGROUND_COLORS = [
  "rgba(255, 99, 132, 0.2)",
  "rgba(54, 162, 235, 0.2)",
  "rgba(255, 206, 86, 0.2)",
  "rgba(75, 192, 192, 0.2)",
  "rgba(153, 102, 255, 0.2)",
  "rgba(255, 159, 64, 0.2)",
];
const BORDER_COLORS = [
  "rgba(255, 99, 132, 1)",
  "rgba(54, 162, 235, 1)",
  "rgba(255, 206, 86, 1)",
  "rgba(75, 192, 192, 1)",
  "rgba(153, 102, 255, 1)",
  "rgba(255, 159, 64, 1)",
];
const BAR_COLOR = "rgba(54, 162, 235, 0.7)";

interface CategoryPieChartProps<T> {
  items: T[];
  getLabel: (item: T) => string | undefined;
  label: string;
  columns: Column<T>[];
}

function CategoryPieChart<T>({ items, getLabel, label, columns }: CategoryPieChartProps<T>) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const counts = items.reduce<Record<string, number>>((acc, item) => {
    const key = getLabel(item) || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  let labels = Object.keys(counts);

  if (!labels.length) return <p>No data</p>;

  const asBar = labels.length > PIE_SLICE_LIMIT;
  if (asBar) {
    labels = [...labels].sort((a, b) => counts[b] - counts[a]);
  }

  const matchingItems = selectedLabel
    ? items.filter((item) => (getLabel(item) || "Unknown") === selectedLabel)
    : [];

  return (
    <>
      {asBar ? (
        <div style={{ height: Math.max(240, labels.length * 32) }}>
          <Bar
            data={{
              labels,
              datasets: [
                {
                  label,
                  data: labels.map((l) => counts[l]),
                  backgroundColor: BAR_COLOR,
                },
              ],
            }}
            options={{
              indexAxis: "y",
              maintainAspectRatio: false,
              plugins: {
                title: { display: true, text: label, font: { size: 16 } },
                legend: { display: false },
              },
              scales: {
                x: { beginAtZero: true, ticks: { precision: 0 } },
              },
              onClick: (_event, elements) => {
                if (!elements.length) return;
                setSelectedLabel(labels[elements[0].index]);
              },
            }}
          />
        </div>
      ) : (
        <Pie
          data={
            {
              labels,
              datasets: [
                {
                  label,
                  data: labels.map((l) => counts[l]),
                  backgroundColor: labels.map(
                    (_, i) => BACKGROUND_COLORS[i % BACKGROUND_COLORS.length]
                  ),
                  borderColor: labels.map((_, i) => BORDER_COLORS[i % BORDER_COLORS.length]),
                  borderWidth: 1,
                },
              ],
            } satisfies ChartData<"pie", number[], string>
          }
          options={
            {
              plugins: {
                title: { display: true, text: label, font: { size: 16 } },
              },
              onClick: (_event, elements) => {
                if (!elements.length) return;
                setSelectedLabel(labels[elements[0].index]);
              },
            } satisfies ChartOptions<"pie">
          }
        />
      )}
      {selectedLabel && (
        <RecordListModal
          title={`${selectedLabel} (${matchingItems.length})`}
          items={matchingItems}
          columns={columns}
          onClose={() => setSelectedLabel(null)}
        />
      )}
    </>
  );
}

export default CategoryPieChart;
