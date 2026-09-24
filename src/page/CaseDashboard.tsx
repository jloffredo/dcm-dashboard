import { useEffect, useMemo, useState } from "react";
import CategoryPieChart from "../component/CategoryPieChart.tsx";
import TrendChart from "../component/TrendChart.tsx";
import { type Column } from "../component/RecordListModal.tsx";
import Filter from "../component/Filter.tsx";
import { getCasesByDateRange, type Case } from "../helper/caseApiHelper.ts";
import { getDefaultDateRange } from "../helper/dateRangeHelper.ts";
import { useFilterOptions } from "../hooks/useFilterOptions.ts";
import classes from "./CaseDashboard.module.css";

const formatDate = (date?: string) => (date ? new Date(date).toLocaleDateString() : "—");

const CaseDashboard = () => {
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [userId, setUserId] = useState("");
  const [agencyId, setAgencyId] = useState("");
  const [cases, setCases] = useState<Case[] | null>(null);
  const { users, agencies, loading: filterOptionsLoading } = useFilterOptions();

  useEffect(() => {
    let cancelled = false;

    getCasesByDateRange(dateRange)
      .then((result) => {
        if (cancelled) return;
        setCases(result);
      })
      .catch((err) => console.error("Failed to load cases", err));

    return () => {
      cancelled = true;
    };
  }, [dateRange]);

  const userNameById = useMemo(
    () => new Map(users.map((user) => [user.id, `${user.first_name} ${user.last_name}`])),
    [users]
  );

  const caseColumns: Column<Case>[] = useMemo(
    () => [
      { header: "Case ID", render: (c) => c.case_id ?? `#${c.id}` },
      { header: "Requested", render: (c) => formatDate(c.requested_date) },
      { header: "Required By", render: (c) => formatDate(c.required_by_date) },
      { header: "Last Updated", render: (c) => formatDate(c.updated_at) },
      { header: "Type", render: (c) => c.case_type?.value ?? "—" },
      { header: "Status", render: (c) => c.status ?? "—" },
      { header: "Priority", render: (c) => c.priority?.value ?? "—" },
      { header: "Agency", render: (c) => c.agency?.value ?? "—" },
      {
        header: "User",
        render: (c) =>
          (c.primary_user_id !== undefined && userNameById.get(c.primary_user_id)) ?? "—",
      },
    ],
    [userNameById]
  );

  const filteredCases = useMemo(() => {
    if (!cases) return cases;
    return cases.filter((c) => {
      if (userId && String(c.primary_user_id) !== userId) return false;
      if (agencyId && String(c.agency?.id) !== agencyId) return false;
      return true;
    });
  }, [cases, userId, agencyId]);

  if (filterOptionsLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <Filter
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        userId={userId}
        onUserIdChange={setUserId}
        agencyId={agencyId}
        onAgencyIdChange={setAgencyId}
        users={users}
        agencies={agencies}
      />
      {filteredCases === null ? (
        <p>Loading...</p>
      ) : (
        <div className={classes.charts}>
          <div className={classes.chart}>
            <CategoryPieChart
              items={filteredCases}
              getLabel={(c) => c.case_type?.value}
              label="# of Cases by Type"
              columns={caseColumns}
            />
          </div>
          <div className={classes.chart}>
            <CategoryPieChart
              items={filteredCases}
              getLabel={(c) => c.status}
              label="# of Cases by Status"
              columns={caseColumns}
            />
          </div>
          <div className={classes.chart}>
            <CategoryPieChart
              items={filteredCases}
              getLabel={(c) => c.agency?.value}
              label="# of Cases by Agency"
              columns={caseColumns}
            />
          </div>
          <div className={classes.chart}>
            <CategoryPieChart
              items={filteredCases}
              getLabel={(c) =>
                c.primary_user_id !== undefined ? userNameById.get(c.primary_user_id) : undefined
              }
              label="# of Cases by User"
              columns={caseColumns}
            />
          </div>
          <div className={classes.wideChart}>
            <TrendChart
              items={filteredCases}
              dateRange={dateRange}
              getDate={(c) => c.requested_date}
              label="Cases Over Time"
              columns={caseColumns}
            />
          </div>
          <div className={classes.wideChart}>
            <TrendChart
              items={filteredCases}
              dateRange={dateRange}
              getDate={(c) => c.updated_at || c.created_at}
              getSeries={(c) => c.status}
              label="Case Status Changes Over Time"
              columns={caseColumns}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDashboard;
