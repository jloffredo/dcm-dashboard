import { get } from "./apiHelper.ts";

export interface Role {
  id: number;
  name: string;
}

// The production API returns roles as {id, value}; the local mock uses {id, name}.
interface RawRole {
  id: number;
  name?: string;
  value?: string;
}

export async function getRoles(): Promise<Role[]> {
  // /role 404s on the production API when given any query params, so sort client-side.
  const roles = await get<RawRole[]>("/role");
  return roles
    .map((role) => ({ id: role.id, name: role.name ?? role.value ?? "" }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
