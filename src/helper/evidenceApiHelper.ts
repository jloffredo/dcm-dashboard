import { getAllPages, isWithinDateRange } from "./apiHelper.ts";
import { getAllCases, type Case } from "./caseApiHelper.ts";
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
  /** The parent case's requested date, which evidence is filtered and listed by. */
  case_requested_date?: string;
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

/**
 * Evidence whose parent case's requested date falls within the range. Evidence has no date of
 * its own to filter by on the production API, so it follows its case.
 *
 * @param dateRange
 * @param cases - All cases, if already loaded; fetched otherwise.
 */
export async function getEvidenceByDateRange(dateRange: DateRange, cases?: Case[]): Promise<Evidence[]> {
  const from = new Date(dateRange.from);
  const to = new Date(dateRange.to);
  const [evidence, allCases] = await Promise.all([
    getAllPages<Evidence>("/evidence"),
    cases ?? getAllCases(),
  ]);

  const requestedDateByCaseId = new Map(allCases.map((c) => [c.id, c.requested_date]));

  return evidence
    .map((e) => ({
      ...e,
      case_requested_date: e.case_id !== undefined ? requestedDateByCaseId.get(e.case_id) : undefined,
    }))
    .filter((e) => isWithinDateRange(e.case_requested_date, from, to));
}
