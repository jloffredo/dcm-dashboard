import { useEffect, useMemo, useState } from "react";
import CategoryPieChart from "../component/CategoryPieChart.tsx";
import { type Column } from "../component/RecordListModal.tsx";
import Filter from "../component/Filter.tsx";
import Loading from "../component/Loading.tsx";
import { getAllCases, type Case } from "../helper/caseApiHelper.ts";
import { getDefaultDateRange, type DateRange } from "../helper/dateRangeHelper.ts";
import {
  getEvidenceByDateRange,
  getEvidenceStatus,
  type Evidence,
} from "../helper/evidenceApiHelper.ts";
import { useFilterOptions } from "../hooks/useFilterOptions.ts";
import classes from "./EvidenceDashboard.module.css";

const formatDate = (date?: string | null) => (date ? new Date(date).toLocaleDateString() : "—");

const EvidenceDashboard = () => {
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [userId, setUserId] = useState("");
  const [agencyId, setAgencyId] = useState("");
  // Remembers which range the evidence was loaded for, so a new range shows as loading
  // instead of leaving the previous range's charts up until the fetch finishes.
  const [loaded, setLoaded] = useState<{ dateRange: DateRange; evidence: Evidence[] } | null>(null);
  const evidence = loaded?.dateRange === dateRange ? loaded.evidence : null;
  const [cases, setCases] = useState<Case[] | null>(null);
  const { users, agencies, loading: filterOptionsLoading } = useFilterOptions();

  useEffect(() => {
    getAllCases()
      .then(setCases)
      .catch((err) => console.error("Failed to load cases", err));
  }, []);

  // Evidence is filtered by its case's requested date, so it waits for the cases.
  useEffect(() => {
    if (!cases) return;
    let cancelled = false;

    getEvidenceByDateRange(dateRange, cases)
      .then((result) => {
        if (cancelled) return;
        setLoaded({ dateRange, evidence: result });
      })
      .catch((err) => console.error("Failed to load evidence", err));

    return () => {
      cancelled = true;
    };
  }, [dateRange, cases]);

  const agencyByCaseId = useMemo(
    () => new Map((cases ?? []).map((c) => [c.id, c.agency?.value])),
    [cases]
  );

  const getAgency = useMemo(
    () => (e: Evidence) => (e.case_id !== undefined ? agencyByCaseId.get(e.case_id) : undefined),
    [agencyByCaseId]
  );

  const evidenceColumns: Column<Evidence>[] = useMemo(
    () => [
      { header: "Evidence ID", render: (e) => e.eid ?? e.display_name ?? `#${e.id}` },
      { header: "Case", render: (e) => e.case_custom_id ?? "—" },
      { header: "Agency", render: (e) => getAgency(e) ?? "—" },
      { header: "Type", render: (e) => e.type?.value ?? "—" },
      { header: "Status", render: (e) => getEvidenceStatus(e) },
      { header: "Assigned To", render: (e) => e.assigned_to?.name ?? "—" },
      { header: "Case Requested", render: (e) => formatDate(e.case_requested_date) },
    ],
    [getAgency]
  );

  if (filterOptionsLoading) {
    return <Loading />;
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
      {evidence === null ? (
        <Loading />
      ) : (
        <div className={classes.charts}>
          <div className={classes.chart}>
            <CategoryPieChart
              items={evidence}
              getLabel={(e) => e.type?.value}
              label="# of Evidence by Type"
              columns={evidenceColumns}
            />
          </div>
          <div className={classes.chart}>
            <CategoryPieChart
              items={evidence}
              getLabel={(e) => getEvidenceStatus(e)}
              label="# of Evidence by Status"
              columns={evidenceColumns}
            />
          </div>
          <div className={classes.chart}>
            <CategoryPieChart
              items={evidence}
              getLabel={(e) => e.assigned_to?.name}
              label="# of Evidence by Assigned User"
              columns={evidenceColumns}
            />
          </div>
          <div className={classes.chart}>
            <CategoryPieChart
              items={evidence}
              getLabel={getAgency}
              label="# of Evidence by Agency"
              columns={evidenceColumns}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceDashboard;
