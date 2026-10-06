import { getAllPages, isWithinDateRange } from "./apiHelper.ts";
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

interface CustomField {
  field_id?: string;
  value?: string | null;
}

// The production API returns cases with display-name keys ("Agency", "Case Type", ...) and
// keeps most data, including the request date and status, in per-tenant custom `fields`.
// The local mock uses the snake_case shape in Case directly.
interface RawCase {
  [key: string]: unknown;
  requested_date?: string;
  required_by_date?: string;
  case_type?: { value?: string };
  priority?: { value?: string };
  agency?: { id?: number; value?: string };
  status?: string;
  primary_user_id?: number | null;
  Agency?: { id?: number; value?: string };
  "Case Type"?: { value?: string };
  Priority?: { value?: string };
  "Deadline Date"?: string | null;
  fields?: Record<string, CustomField> | null;
}

const fieldValue = (raw: RawCase, name: string) => raw.fields?.[name]?.value ?? undefined;

/** Maps either API response shape onto Case. */
export function normalizeCase(raw: RawCase): Case {
  return {
    ...raw,
    requested_date: raw.requested_date ?? fieldValue(raw, "Request Date"),
    required_by_date: raw.required_by_date ?? raw["Deadline Date"] ?? undefined,
    case_type: raw.case_type ?? raw["Case Type"],
    priority: raw.priority ?? raw.Priority,
    agency: raw.agency ?? raw.Agency,
    status: raw.status ?? fieldValue(raw, "INTERNAL Case Status"),
    primary_user_id: raw.primary_user_id ?? undefined,
  };
}

/** Every case, regardless of date. */
export async function getAllCases(): Promise<Case[]> {
  const cases = await getAllPages<RawCase>("/case");
  return cases.map(normalizeCase);
}

/** Cases whose requested date falls within the range. */
export async function getCasesByDateRange(dateRange: DateRange): Promise<Case[]> {
  const from = new Date(dateRange.from);
  const to = new Date(dateRange.to);
  const cases = await getAllCases();
  return cases.filter((c) => isWithinDateRange(c.requested_date, from, to));
}
