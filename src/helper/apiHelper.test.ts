import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  get,
  getAllByDateRange,
  getApiKey,
  onUnauthorized,
  setApiKey,
  UnauthorizedError,
} from "./apiHelper.ts";

function jsonResponse(body: unknown, init: { status?: number; ok?: boolean } = {}) {
  const status = init.status ?? 200;
  return {
    ok: init.ok ?? (status >= 200 && status < 300),
    status,
    statusText: `Status ${status}`,
    json: async () => body,
  } as Response;
}

describe("apiHelper", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getApiKey / setApiKey", () => {
    it("falls back to 'local-dev' when nothing is stored", () => {
      expect(getApiKey()).toBe("local-dev");
    });

    it("returns a key persisted via setApiKey", () => {
      setApiKey("my-key");
      expect(getApiKey()).toBe("my-key");
    });

    it("persists the key in localStorage under a stable key", () => {
      setApiKey("my-key");
      expect(localStorage.getItem("dcm_api_key")).toBe("my-key");
    });
  });

  describe("get", () => {
    it("requests the base URL + path with the api-key header", async () => {
      setApiKey("secret-key");
      vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ hello: "world" }));

      const result = await get("/case");

      expect(result).toEqual({ hello: "world" });
      const [url, options] = vi.mocked(fetch).mock.calls[0];
      expect(String(url)).toBe("http://localhost:8000/service/api/v1/case");
      expect(options).toMatchObject({ method: "GET", headers: { "api-key": "secret-key" } });
    });

    it("appends defined params as query string entries and skips null/undefined ones", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([]));

      await get("/case", { "sort-by": "name", start: 0, skip: undefined, skipToo: null });

      const [url] = vi.mocked(fetch).mock.calls[0];
      const parsed = new URL(String(url));
      expect(parsed.searchParams.get("sort-by")).toBe("name");
      expect(parsed.searchParams.get("start")).toBe("0");
      expect(parsed.searchParams.has("skip")).toBe(false);
      expect(parsed.searchParams.has("skipToo")).toBe(false);
    });

    it("throws UnauthorizedError and notifies listeners on a 401 response", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ error: "nope" }, { status: 401 }));
      const listener = vi.fn();
      const unsubscribe = onUnauthorized(listener);

      await expect(get("/case")).rejects.toBeInstanceOf(UnauthorizedError);
      expect(listener).toHaveBeenCalledOnce();

      unsubscribe();
    });

    it("stops notifying a listener after it unsubscribes", async () => {
      const listener = vi.fn();
      const unsubscribe = onUnauthorized(listener);
      unsubscribe();

      vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, { status: 401 }));
      await expect(get("/case")).rejects.toBeInstanceOf(UnauthorizedError);
      expect(listener).not.toHaveBeenCalled();
    });

    it("throws a plain Error for other non-ok statuses", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, { status: 500 }));
      await expect(get("/case")).rejects.toThrow(/500/);
    });
  });

  describe("getAllByDateRange", () => {
    it("filters out-of-range records and pages until a short page is returned", async () => {
      const fullPage = Array.from({ length: 200 }, (_, i) => ({
        id: i + 1,
        created_at: `2026-01-${String((i % 28) + 1).padStart(2, "0")}`,
      }));
      const finalPage = [
        { id: 201, created_at: "2026-02-01" },
        { id: 202, created_at: "2026-03-01" }, // outside the requested range, filtered out
      ];
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse(fullPage))
        .mockResolvedValueOnce(jsonResponse(finalPage));

      const results = await getAllByDateRange(
        "/log",
        {},
        "created_at",
        new Date("2026-01-01"),
        new Date("2026-02-28")
      );

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(201);
      expect(results.some((r) => r.id === 202)).toBe(false);
    });

    it("stops after the first page once records exceed dateTo", async () => {
      const page = [
        { id: 1, created_at: "2026-01-01" },
        { id: 2, created_at: "2026-06-01" }, // past dateTo — should stop paging
      ];
      vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(page));

      const results = await getAllByDateRange(
        "/log",
        {},
        "created_at",
        new Date("2026-01-01"),
        new Date("2026-01-31")
      );

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(results).toEqual([{ id: 1, created_at: "2026-01-01" }]);
    });

    it("returns an empty array immediately when the endpoint has no records", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([]));

      const results = await getAllByDateRange(
        "/log",
        {},
        "created_at",
        new Date("2026-01-01"),
        new Date("2026-01-31")
      );

      expect(results).toEqual([]);
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });
});
