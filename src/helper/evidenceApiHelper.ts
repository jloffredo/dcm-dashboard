import { getAllByDateRange } from "./apiHelper.ts";
import type { DateRange } from "./dateRangeHelper.ts";

interface EvidenceUserRef {
  id: number;
  name: string;
}

export interface Evidence {
  [key: string]: unknown;
  id?: number;
  eid?: string;
  display_name?: string;
  case_id?: number;
  case_custom_id?: string;
  type?: { id?: number; value?: string };
  assigned_to?: EvidenceUserRef | null;
  assigned_date?: string | null;
  triaged_by?: EvidenceUserRef | null;
  triaged_date?: string | null;
  imaged_by?: EvidenceUserRef | null;
  imaged_date?: string | null;
  completed_by?: EvidenceUserRef | null;
  completed_date?: string | null;
  created_at?: string;
}

// The API has no first-class status field for evidence, so it's derived from how far
// the item has progressed through the assigned -> triaged -> imaged -> completed pipeline.
export function getEvidenceStatus(evidence: Evidence): string {
  if (evidence.completed_date) return "Completed";
  if (evidence.imaged_date) return "Imaged";
  if (evidence.triaged_date) return "Triaged";
  if (evidence.assigned_date) return "Assigned";
  return "Intake";
}

export function getEvidenceByDateRange(dateRange: DateRange): Promise<Evidence[]> {
  return getAllByDateRange<Evidence>(
    "/evidence",
    {},
    "created_at",
    new Date(dateRange.from),
    new Date(dateRange.to)
  );
}
