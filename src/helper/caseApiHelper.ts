import { get, getAllByDateRange } from "./apiHelper.ts";
import type { DateRange } from "./dateRangeHelper.ts";

export interface Case {
  [key: string]: unknown;
  id?: number;
  case_id?: string;
  requested_date?: string;
  required_by_date?: string;
  updated_at?: string;
  created_at?: string;
  priority?: { value?: string };
  case_type?: { value?: string };
  status?: string;
  primary_user_id?: number;
  agency?: { id?: number; value?: string };
}

export function getCasesByDateRange(dateRange: DateRange): Promise<Case[]> {
  return getAllByDateRange<Case>(
    "/case",
    {},
    "requested_date",
    new Date(dateRange.from),
    new Date(dateRange.to)
  );
}

// Unfiltered, for cross-referencing other records (e.g. evidence) against a case's
// fields (like agency) regardless of whether the case itself falls in a selected date range.
export function getAllCases(): Promise<Case[]> {
  return get<Case[]>("/case", { length: 500 });
}
