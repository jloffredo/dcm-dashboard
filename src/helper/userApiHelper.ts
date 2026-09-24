import { get } from "./apiHelper.ts";
import { getAgencies } from "./agencyApiHelper.ts";
import { getRoles } from "./roleApiHelper.ts";

interface RawUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  agency_id: number | null;
  role_id: number | null;
  active: boolean;
}

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  agency: string;
  role: string;
  active: boolean;
}

export async function getUsers(): Promise<User[]> {
  const [users, agencies, roles] = await Promise.all([
    get<RawUser[]>("/user", { length: 100, "sort-by": "last_name", "sort-direction": "asc" }),
    getAgencies(),
    getRoles(),
  ]);

  const agencyById = new Map(agencies.map((agency) => [agency.id, agency.title]));
  const roleById = new Map(roles.map((role) => [role.id, role.name]));

  return users.map((user) => ({
    id: user.id,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    active: user.active,
    agency: (user.agency_id !== null && agencyById.get(user.agency_id)) || "Unknown",
    role: (user.role_id !== null && roleById.get(user.role_id)) || "Unknown",
  }));
}
