import { get } from "./apiHelper.ts";

export interface Agency {
  id: number;
  title: string;
}

export function getAgencies(): Promise<Agency[]> {
  return get<Agency[]>("/agency", { length: 100, "sort-by": "title", "sort-direction": "asc" });
}
