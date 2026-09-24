export interface DateRange {
  from: string;
  to: string;
}

export const today = new Date().toISOString().split("T")[0];

const toISODate = (date: Date) => date.toISOString().split("T")[0];

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const startOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);
const endOfYear = (date: Date) => new Date(date.getFullYear(), 11, 31);

const monthsAgo = (n: number) => {
  const date = new Date();
  date.setMonth(date.getMonth() - n);
  return date;
};

const firstOfMonth = () => toISODate(startOfMonth(new Date()));

export const getDefaultDateRange = (): DateRange => ({ from: firstOfMonth(), to: today });

export interface DateRangePreset {
  id: string;
  label: string;
  range: () => DateRange;
}

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  { id: "this-month", label: "This month", range: () => ({ from: firstOfMonth(), to: today }) },
  {
    id: "last-month",
    label: "Last month",
    range: () => {
      const lastMonth = monthsAgo(1);
      return { from: toISODate(startOfMonth(lastMonth)), to: toISODate(endOfMonth(lastMonth)) };
    },
  },
  {
    id: "last-3-months",
    label: "Last 3 months",
    range: () => ({ from: toISODate(monthsAgo(3)), to: today }),
  },
  {
    id: "last-6-months",
    label: "Last 6 months",
    range: () => ({ from: toISODate(monthsAgo(6)), to: today }),
  },
  {
    id: "this-year",
    label: "This year",
    range: () => ({ from: toISODate(startOfYear(new Date())), to: today }),
  },
  {
    id: "last-year",
    label: "Last year",
    range: () => {
      const lastYear = new Date(new Date().getFullYear() - 1, 0, 1);
      return { from: toISODate(startOfYear(lastYear)), to: toISODate(endOfYear(lastYear)) };
    },
  },
];
