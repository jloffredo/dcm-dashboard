import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAllPages } from "./apiHelper.ts";
import { getCasesByDateRange, normalizeCase } from "./caseApiHelper.ts";

vi.mock("./apiHelper.ts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./apiHelper.ts")>()),
  getAllPages: vi.fn(),
}));

const productionCase = {
  id: 643,
  case_id: "Demo-2025-1",
  Agency: { id: 93, value: "Testing PD" },
  "Case Type": { option_id: 7, value: "Cyber" },
  Priority: { option_id: 18, value: "Medium" },
  "Deadline Date": "2026-11-30",
  primary_user_id: null,
  fields: {
    "Request Date": { field_id: "1_1975", value: "2025-01-07" },
    "INTERNAL Case Status": { field_id: "1_2288", value: "Waiting For GrayKey" },
  },
};

describe("normalizeCase", () => {
  it("maps the production API's display-name keys and custom fields", () => {
    expect(normalizeCase(productionCase)).toMatchObject({
      id: 643,
      case_id: "Demo-2025-1",
      requested_date: "2025-01-07",
      required_by_date: "2026-11-30",
      case_type: { value: "Cyber" },
      priority: { value: "Medium" },
      agency: { id: 93, value: "Testing PD" },
      status: "Waiting For GrayKey",
      primary_user_id: undefined,
    });
  });

  it("leaves the mock API's snake_case shape as is", () => {
    const mockCase = {
      id: 1,
      requested_date: "2026-01-02",
      required_by_date: "2026-02-01",
      case_type: { value: "Fraud" },
      priority: { value: "High" },
      agency: { id: 3, value: "PD" },
      status: "Open",
      primary_user_id: 7,
    };
    expect(normalizeCase(mockCase)).toMatchObject(mockCase);
  });

  it("leaves fields undefined when the custom fields are missing", () => {
    const normalized = normalizeCase({ id: 1, fields: null, "Deadline Date": null });
    expect(normalized.requested_date).toBeUndefined();
    expect(normalized.required_by_date).toBeUndefined();
    expect(normalized.status).toBeUndefined();
  });
});

describe("getCasesByDateRange", () => {
  beforeEach(() => {
    vi.mocked(getAllPages).mockReset();
  });

  it("returns only cases whose request date is in range", async () => {
    vi.mocked(getAllPages).mockResolvedValue([
      productionCase,
      { ...productionCase, id: 2, fields: { "Request Date": { value: "2018-07-19" } } },
      { ...productionCase, id: 3, fields: {} },
    ]);

    const cases = await getCasesByDateRange({ from: "2025-01-01", to: "2025-01-31" });

    expect(cases.map((c) => c.id)).toEqual([643]);
  });
});
