import { describe, expect, it, vi } from "vitest";
import { getEvidenceStatus, type Evidence } from "./evidenceApiHelper.ts";

vi.mock("./apiHelper.ts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./apiHelper.ts")>()),
  getAllPages: vi.fn(),
}));

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

describe("getEvidenceByDateRange", () => {
  it("keeps evidence whose case was requested in range and tags it with that date", async () => {
    const { getEvidenceByDateRange } = await import("./evidenceApiHelper.ts");
    const { getAllPages } = await import("./apiHelper.ts");
    vi.mocked(getAllPages).mockResolvedValue([
      { id: 1, case_id: 10 },
      { id: 2, case_id: 20 },
      { id: 3, case_id: 99 }, // case not found
    ]);

    const evidence = await getEvidenceByDateRange({ from: "2025-01-01", to: "2025-01-31" }, [
      { id: 10, requested_date: "2025-01-07" },
      { id: 20, requested_date: "2018-07-19" },
    ]);

    expect(evidence).toEqual([{ id: 1, case_id: 10, case_requested_date: "2025-01-07" }]);
  });
});
