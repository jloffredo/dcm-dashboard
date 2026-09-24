import { useState } from "react";
import classes from "./Filter.module.css";
import type { User } from "../helper/userApiHelper.ts";
import type { Agency } from "../helper/agencyApiHelper.ts";
import { type DateRange, DATE_RANGE_PRESETS, today } from "../helper/dateRangeHelper.ts";

interface FilterProps {
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
  userId: string;
  onUserIdChange: (userId: string) => void;
  agencyId: string;
  onAgencyIdChange: (agencyId: string) => void;
  users: User[];
  agencies: Agency[];
}

const Filter = ({
  dateRange,
  onDateRangeChange,
  userId,
  onUserIdChange,
  agencyId,
  onAgencyIdChange,
  users,
  agencies,
}: FilterProps) => {
  const [selectedPreset, setSelectedPreset] = useState("");

  const selectedAgency = agencies.find((agency) => String(agency.id) === agencyId);
  const selectedUser = users.find((user) => String(user.id) === userId);

  const visibleUsers = selectedAgency
    ? users.filter((user) => user.agency === selectedAgency.title)
    : users;
  const visibleAgencies = selectedUser
    ? agencies.filter((agency) => agency.title === selectedUser.agency)
    : agencies;

  return (
    <div className={classes.filter}>
      <div className={classes.field}>
        <label htmlFor="range">Quick range</label>
        <select
          id="range"
          name="range"
          value={selectedPreset}
          onChange={(e) => {
            const preset = DATE_RANGE_PRESETS.find((p) => p.id === e.target.value);
            if (preset) {
              setSelectedPreset(preset.id);
              onDateRangeChange(preset.range());
            }
          }}
        >
          <option value="" disabled>
            Select a range
          </option>
          {DATE_RANGE_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>
      <div className={classes.field}>
        <label htmlFor="from">From</label>
        <input
          type="date"
          id="from"
          name="from"
          max={today}
          value={dateRange.from}
          onChange={(e) => {
            setSelectedPreset("");
            onDateRangeChange({ ...dateRange, from: e.target.value });
          }}
        />
      </div>
      <div className={classes.field}>
        <label htmlFor="to">To</label>
        <input
          type="date"
          id="to"
          name="to"
          max={today}
          value={dateRange.to}
          onChange={(e) => {
            setSelectedPreset("");
            onDateRangeChange({ ...dateRange, to: e.target.value });
          }}
        />
      </div>
      <div className={classes.field}>
        <label htmlFor="user">User</label>
        <select
          id="user"
          name="user"
          value={userId}
          onChange={(e) => onUserIdChange(e.target.value)}
        >
          <option value="">All users</option>
          {visibleUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.first_name} {user.last_name}
            </option>
          ))}
        </select>
      </div>
      <div className={classes.field}>
        <label htmlFor="agency">Agency</label>
        <select
          id="agency"
          name="agency"
          value={agencyId}
          onChange={(e) => onAgencyIdChange(e.target.value)}
        >
          <option value="">All agencies</option>
          {visibleAgencies.map((agency) => (
            <option key={agency.id} value={agency.id}>
              {agency.title}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Filter;
