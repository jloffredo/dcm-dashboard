import { describe, expect, it } from "vitest";
import { getEvidenceStatus, type Evidence } from "./evidenceApiHelper.ts";

describe("getEvidenceStatus", () => {
  it('returns "Completed" when completed_date is set, regardless of other fields', () => {
    const evidence: Evidence = {
      completed_date: "2026-01-05",
      imaged_date: "2026-01-04",
      triaged_date: "2026-01-03",
      assigned_date: "2026-01-02",
    };
    expect(getEvidenceStatus(evidence)).toBe("Completed");
  });

  it('returns "Imaged" when imaged but not completed', () => {
    const evidence: Evidence = { imaged_date: "2026-01-04", triaged_date: "2026-01-03" };
    expect(getEvidenceStatus(evidence)).toBe("Imaged");
  });

  it('returns "Triaged" when triaged but not imaged', () => {
    const evidence: Evidence = { triaged_date: "2026-01-03", assigned_date: "2026-01-02" };
    expect(getEvidenceStatus(evidence)).toBe("Triaged");
  });

  it('returns "Assigned" when only assigned', () => {
    const evidence: Evidence = { assigned_date: "2026-01-02" };
    expect(getEvidenceStatus(evidence)).toBe("Assigned");
  });

  it('returns "Intake" when nothing in the pipeline has happened yet', () => {
    expect(getEvidenceStatus({})).toBe("Intake");
  });

  it("ignores null date fields the same as missing ones", () => {
    const evidence: Evidence = {
      completed_date: null,
      imaged_date: null,
      triaged_date: "2026-01-03",
    };
    expect(getEvidenceStatus(evidence)).toBe("Triaged");
  });
});
