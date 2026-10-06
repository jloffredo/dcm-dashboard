import { beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "./apiHelper.ts";
import { getRoles } from "./roleApiHelper.ts";

vi.mock("./apiHelper.ts", () => ({ get: vi.fn() }));

describe("getRoles", () => {
  beforeEach(() => {
    vi.mocked(get).mockReset();
  });

  it("requests /role without query params", async () => {
    vi.mocked(get).mockResolvedValue([]);

    await getRoles();

    expect(get).toHaveBeenCalledWith("/role");
  });

  it("accepts both {id, value} and {id, name} shapes and sorts by name", async () => {
    vi.mocked(get).mockResolvedValue([
      { id: 2, value: "Examiner" },
      { id: 1, name: "Admin" },
    ]);

    expect(await getRoles()).toEqual([
      { id: 1, name: "Admin" },
      { id: 2, name: "Examiner" },
    ]);
  });
});
