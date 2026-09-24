import { afterEach, describe, expect, it, vi } from "vitest";

// `today` and the presets below read the current date at module load time, so each test
// mocks the system clock and re-imports the module to get a range computed against it.
async function loadWithMockedNow(isoDateTime: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(isoDateTime));
  vi.resetModules();
  return import("./dateRangeHelper");
}

describe("dateRangeHelper", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("getDefaultDateRange spans from the 1st of the current month through today", async () => {
    const { getDefaultDateRange } = await loadWithMockedNow("2026-03-15T12:00:00Z");
    expect(getDefaultDateRange()).toEqual({ from: "2026-03-01", to: "2026-03-15" });
  });

  describe("DATE_RANGE_PRESETS", () => {
    it('"this-month" matches the default range', async () => {
      const { DATE_RANGE_PRESETS } = await loadWithMockedNow("2026-03-15T12:00:00Z");
      const preset = DATE_RANGE_PRESETS.find((p) => p.id === "this-month")!;
      expect(preset.range()).toEqual({ from: "2026-03-01", to: "2026-03-15" });
    });

    it('"last-month" spans the full previous calendar month', async () => {
      const { DATE_RANGE_PRESETS } = await loadWithMockedNow("2026-03-15T12:00:00Z");
      const preset = DATE_RANGE_PRESETS.find((p) => p.id === "last-month")!;
      expect(preset.range()).toEqual({ from: "2026-02-01", to: "2026-02-28" });
    });

    it('"last-3-months" spans from 3 months ago through today', async () => {
      const { DATE_RANGE_PRESETS } = await loadWithMockedNow("2026-03-15T12:00:00Z");
      const preset = DATE_RANGE_PRESETS.find((p) => p.id === "last-3-months")!;
      expect(preset.range()).toEqual({ from: "2025-12-15", to: "2026-03-15" });
    });

    it('"last-6-months" spans from 6 months ago through today', async () => {
      const { DATE_RANGE_PRESETS } = await loadWithMockedNow("2026-03-15T12:00:00Z");
      const preset = DATE_RANGE_PRESETS.find((p) => p.id === "last-6-months")!;
      expect(preset.range()).toEqual({ from: "2025-09-15", to: "2026-03-15" });
    });

    it('"this-year" spans from January 1st through today', async () => {
      const { DATE_RANGE_PRESETS } = await loadWithMockedNow("2026-03-15T12:00:00Z");
      const preset = DATE_RANGE_PRESETS.find((p) => p.id === "this-year")!;
      expect(preset.range()).toEqual({ from: "2026-01-01", to: "2026-03-15" });
    });

    it('"last-year" spans the full previous calendar year', async () => {
      const { DATE_RANGE_PRESETS } = await loadWithMockedNow("2026-03-15T12:00:00Z");
      const preset = DATE_RANGE_PRESETS.find((p) => p.id === "last-year")!;
      expect(preset.range()).toEqual({ from: "2025-01-01", to: "2025-12-31" });
    });

    it("covers exactly the six documented presets", async () => {
      const { DATE_RANGE_PRESETS } = await loadWithMockedNow("2026-03-15T12:00:00Z");
      expect(DATE_RANGE_PRESETS.map((p) => p.id)).toEqual([
        "this-month",
        "last-month",
        "last-3-months",
        "last-6-months",
        "this-year",
        "last-year",
      ]);
    });
  });
});
