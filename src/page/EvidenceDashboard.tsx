import { useEffect, useMemo, useState } from "react";
import CategoryPieChart from "../component/CategoryPieChart.tsx";
import { type Column } from "../component/RecordListModal.tsx";
import Filter from "../component/Filter.tsx";
import { getAllCases, type Case } from "../helper/caseApiHelper.ts";
import { getDefaultDateRange } from "../helper/dateRangeHelper.ts";
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
  const [evidence, setEvidence] = useState<Evidence[] | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const { users, agencies, loading: filterOptionsLoading } = useFilterOptions();

  useEffect(() => {
    let cancelled = false;

    getEvidenceByDateRange(dateRange)
      .then((result) => {
        if (cancelled) return;
        setEvidence(result);
      })
      .catch((err) => console.error("Failed to load evidence", err));

    return () => {
      cancelled = true;
    };
  }, [dateRange]);

  useEffect(() => {
    getAllCases()
      .then(setCases)
      .catch((err) => console.error("Failed to load cases", err));
  }, []);

  const agencyByCaseId = useMemo(
    () => new Map(cases.map((c) => [c.id, c.agency?.value])),
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
      { header: "Created", render: (e) => formatDate(e.created_at) },
    ],
    [getAgency]
  );

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
      {evidence === null ? (
        <p>Loading...</p>
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
