import { beforeEach, describe, expect, it, vi } from "vitest";
import { getUsers } from "./userApiHelper.ts";
import { get } from "./apiHelper.ts";
import { getAgencies } from "./agencyApiHelper.ts";
import { getRoles } from "./roleApiHelper.ts";

vi.mock("./apiHelper.ts", () => ({ get: vi.fn() }));
vi.mock("./agencyApiHelper.ts", () => ({ getAgencies: vi.fn() }));
vi.mock("./roleApiHelper.ts", () => ({ getRoles: vi.fn() }));

describe("getUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests users sorted by last name and resolves agency/role names", async () => {
    vi.mocked(get).mockResolvedValue([
      {
        id: 1,
        username: "auser",
        first_name: "Ada",
        last_name: "User",
        email: "a@example.com",
        agency_id: 10,
        role_id: 20,
        active: true,
      },
    ]);
    vi.mocked(getAgencies).mockResolvedValue([{ id: 10, title: "Springfield PD" }]);
    vi.mocked(getRoles).mockResolvedValue([{ id: 20, name: "Analyst" }]);

    const users = await getUsers();

    expect(get).toHaveBeenCalledWith("/user", {
      length: 100,
      "sort-by": "last_name",
      "sort-direction": "asc",
    });
    expect(users).toEqual([
      {
        id: 1,
        username: "auser",
        first_name: "Ada",
        last_name: "User",
        email: "a@example.com",
        active: true,
        agency: "Springfield PD",
        role: "Analyst",
      },
    ]);
  });

  it('falls back to "Unknown" when agency_id/role_id is null or unmatched', async () => {
    vi.mocked(get).mockResolvedValue([
      {
        id: 2,
        username: "buser",
        first_name: "Bob",
        last_name: "User",
        email: "b@example.com",
        agency_id: null,
        role_id: 999,
        active: false,
      },
    ]);
    vi.mocked(getAgencies).mockResolvedValue([]);
    vi.mocked(getRoles).mockResolvedValue([]);

    const [user] = await getUsers();

    expect(user.agency).toBe("Unknown");
    expect(user.role).toBe("Unknown");
  });

  it("fetches users, agencies, and roles concurrently", async () => {
    vi.mocked(get).mockResolvedValue([]);
    vi.mocked(getAgencies).mockResolvedValue([]);
    vi.mocked(getRoles).mockResolvedValue([]);

    await getUsers();

    expect(get).toHaveBeenCalledOnce();
    expect(getAgencies).toHaveBeenCalledOnce();
    expect(getRoles).toHaveBeenCalledOnce();
  });
});
