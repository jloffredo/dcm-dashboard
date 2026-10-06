import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { get, getApiKey, onUnauthorized, setApiKey, UnauthorizedError } from "../helper/apiHelper.ts";
import classes from "./ApiKeyGate.module.css";

interface ApiKeyGateProps {
  children: ReactNode;
}

const ApiKeyGate = ({ children }: ApiKeyGateProps) => {
  const [unauthorized, setUnauthorized] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => onUnauthorized(() => setUnauthorized(true)), []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setError(null);

    const previousKey = getApiKey();
    const candidateKey = apiKeyInput.trim();
    setApiKey(candidateKey);

    try {
      // /me 404s on the production API when given any query params, so call it bare.
      await get("/me");
      window.location.reload();
    } catch (err) {
      setApiKey(previousKey);
      setError(
        err instanceof UnauthorizedError
          ? "That API key was rejected. Please check it and try again."
          : "Could not verify the API key. Please try again."
      );
      setChecking(false);
    }
  };

  if (!unauthorized) return <>{children}</>;

  return (
    <div className={classes.page}>
      <form className={classes.card} onSubmit={handleSubmit}>
        <h1>API key required</h1>
        <p>The server rejected the current API key (401 Unauthorized). Enter a valid key to continue.</p>
        <div className={classes.field}>
          <label htmlFor="api-key">API key</label>
          <input
            id="api-key"
            type="text"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            autoFocus
            required
          />
        </div>
        {error && <p className={classes.error}>{error}</p>}
        <button type="submit" className={classes.submit} disabled={checking || !apiKeyInput.trim()}>
          {checking ? "Checking..." : "Save and continue"}
        </button>
      </form>
    </div>
  );
};

export default ApiKeyGate;
