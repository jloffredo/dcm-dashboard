import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ApiKeyGate from "./ApiKeyGate.tsx";
import { get, getApiKey, onUnauthorized, setApiKey, UnauthorizedError } from "../helper/apiHelper.ts";

vi.mock("../helper/apiHelper.ts", () => {
  class UnauthorizedError extends Error {}
  return {
    get: vi.fn(),
    getApiKey: vi.fn(() => "previous-key"),
    onUnauthorized: vi.fn(),
    setApiKey: vi.fn(),
    UnauthorizedError,
  };
});

function triggerUnauthorized() {
  const listener = vi.mocked(onUnauthorized).mock.calls[0][0];
  act(() => listener());
}

describe("ApiKeyGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(onUnauthorized).mockImplementation(() => () => {});
    vi.mocked(getApiKey).mockReturnValue("previous-key");
    Object.defineProperty(window, "location", {
      value: { ...window.location, reload: vi.fn() },
      writable: true,
    });
  });

  it("renders its children when no 401 has occurred", () => {
    render(
      <ApiKeyGate>
        <p>Protected content</p>
      </ApiKeyGate>
    );
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("shows the API key prompt instead of children once unauthorized fires", () => {
    render(
      <ApiKeyGate>
        <p>Protected content</p>
      </ApiKeyGate>
    );

    triggerUnauthorized();

    expect(screen.getByRole("heading", { name: "API key required" })).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("saves the new key and reloads the page when it is accepted", async () => {
    const user = userEvent.setup();
    vi.mocked(get).mockResolvedValue({});

    render(
      <ApiKeyGate>
        <p>Protected content</p>
      </ApiKeyGate>
    );
    triggerUnauthorized();

    await user.type(screen.getByLabelText("API key"), "new-valid-key");
    await user.click(screen.getByRole("button", { name: "Save and continue" }));

    await waitFor(() => expect(window.location.reload).toHaveBeenCalledOnce());
    expect(setApiKey).toHaveBeenCalledWith("new-valid-key");
    expect(get).toHaveBeenCalledWith("/me");
  });

  it("shows a specific message and restores the previous key when the key is rejected", async () => {
    const user = userEvent.setup();
    vi.mocked(get).mockRejectedValue(new UnauthorizedError("Unauthorized"));

    render(
      <ApiKeyGate>
        <p>Protected content</p>
      </ApiKeyGate>
    );
    triggerUnauthorized();

    await user.type(screen.getByLabelText("API key"), "bad-key");
    await user.click(screen.getByRole("button", { name: "Save and continue" }));

    expect(await screen.findByText(/was rejected/i)).toBeInTheDocument();
    expect(setApiKey).toHaveBeenLastCalledWith("previous-key");
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  it("shows a generic error message for a non-auth failure", async () => {
    const user = userEvent.setup();
    vi.mocked(get).mockRejectedValue(new Error("network down"));

    render(
      <ApiKeyGate>
        <p>Protected content</p>
      </ApiKeyGate>
    );
    triggerUnauthorized();

    await user.type(screen.getByLabelText("API key"), "some-key");
    await user.click(screen.getByRole("button", { name: "Save and continue" }));

    expect(await screen.findByText(/Could not verify the API key/i)).toBeInTheDocument();
  });
});
