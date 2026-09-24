import { useEffect, useState } from "react";
import { getUsers, type User } from "../helper/userApiHelper.ts";
import { getAgencies, type Agency } from "../helper/agencyApiHelper.ts";

interface FilterOptions {
  users: User[];
  agencies: Agency[];
  loading: boolean;
}

// Fetches the User/Agency filter options once, so pages can hold off rendering
// the filter (and the rest of the page) until both lists have finished loading.
export function useFilterOptions(): FilterOptions {
  const [users, setUsers] = useState<User[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [agenciesLoaded, setAgenciesLoaded] = useState(false);

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch((err) => console.error("Failed to load users", err))
      .finally(() => setUsersLoaded(true));
    getAgencies()
      .then(setAgencies)
      .catch((err) => console.error("Failed to load agencies", err))
      .finally(() => setAgenciesLoaded(true));
  }, []);

  return { users, agencies, loading: !usersLoaded || !agenciesLoaded };
}
