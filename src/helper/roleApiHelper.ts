import { get } from "./apiHelper.ts";

export interface Role {
  id: number;
  name: string;
}

export function getRoles(): Promise<Role[]> {
  return get<Role[]>("/role", { length: 100, "sort-by": "name", "sort-direction": "asc" });
}
