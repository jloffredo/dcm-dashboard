import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Filter from "./Filter.tsx";
import type { User } from "../helper/userApiHelper.ts";
import type { Agency } from "../helper/agencyApiHelper.ts";
import type { DateRange } from "../helper/dateRangeHelper.ts";

const users: User[] = [
  {
    id: 1,
    username: "ada",
    first_name: "Ada",
    last_name: "Lovelace",
    email: "ada@example.com",
    agency: "Springfield PD",
    role: "Analyst",
    active: true,
  },
  {
    id: 2,
    username: "bob",
    first_name: "Bob",
    last_name: "Builder",
    email: "bob@example.com",
    agency: "Shelbyville PD",
    role: "Investigator",
    active: true,
  },
];

const agencies: Agency[] = [
  { id: 10, title: "Springfield PD" },
  { id: 20, title: "Shelbyville PD" },
];

function ControlledFilter() {
  const [dateRange, setDateRange] = useState<DateRange>({ from: "2026-01-01", to: "2026-01-31" });
  const [userId, setUserId] = useState("");
  const [agencyId, setAgencyId] = useState("");
  return (
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
  );
}

function userOptionLabels() {
  return within(screen.getByLabelText("User"))
    .getAllByRole("option")
    .map((o) => o.textContent);
}

function agencyOptionLabels() {
  return within(screen.getByLabelText("Agency"))
    .getAllByRole("option")
    .map((o) => o.textContent);
}

describe("Filter", () => {
  it("lists every user and agency when nothing is selected", () => {
    render(<ControlledFilter />);
    expect(userOptionLabels()).toEqual(["All users", "Ada Lovelace", "Bob Builder"]);
    expect(agencyOptionLabels()).toEqual(["All agencies", "Springfield PD", "Shelbyville PD"]);
  });

  it("narrows the user list to the selected agency", async () => {
    const user = userEvent.setup();
    render(<ControlledFilter />);

    await user.selectOptions(screen.getByLabelText("Agency"), "Springfield PD");

    expect(userOptionLabels()).toEqual(["All users", "Ada Lovelace"]);
  });

  it("narrows the agency list to the selected user's agency", async () => {
    const user = userEvent.setup();
    render(<ControlledFilter />);

    await user.selectOptions(screen.getByLabelText("User"), "Bob Builder");

    expect(agencyOptionLabels()).toEqual(["All agencies", "Shelbyville PD"]);
  });

  it("updates the date inputs when a quick-range preset is chosen", async () => {
    const user = userEvent.setup();
    render(<ControlledFilter />);

    await user.selectOptions(screen.getByLabelText("Quick range"), "This year");

    const fromInput = screen.getByLabelText("From") as HTMLInputElement;
    const toInput = screen.getByLabelText("To") as HTMLInputElement;
    const currentYear = new Date().getFullYear().toString();
    expect(fromInput.value).toBe(`${currentYear}-01-01`);
    expect(toInput.value.slice(0, 4)).toBe(currentYear);
  });

  it("clears the selected quick-range preset after manually editing a date", async () => {
    const user = userEvent.setup();
    render(<ControlledFilter />);

    await user.selectOptions(screen.getByLabelText("Quick range"), "This year");
    expect((screen.getByLabelText("Quick range") as HTMLSelectElement).value).toBe("this-year");

    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-02-01" } });

    expect((screen.getByLabelText("Quick range") as HTMLSelectElement).value).toBe("");
  });
});
