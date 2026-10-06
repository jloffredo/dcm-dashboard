// Thin wrapper around the DCM API (see api/dcm-api-v1-openapi.yaml). Only GET is implemented
// since that's all the frontend needs right now.
//
// Configure via a .env file (see Vite's env docs):
//   VITE_API_BASE_URL=http://localhost:8000/service/api/v1
//   VITE_API_KEY=local-dev
// For a remote API without CORS support, use a relative base URL and let the Vite dev server
// proxy it (see vite.config.ts):
//   VITE_API_BASE_URL=/service/api/v1
//   API_PROXY_TARGET=https://example.com

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/service/api/v1';

const API_KEY_STORAGE_KEY = 'dcm_api_key';

function getStoredApiKey(): string | null {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Returns the API key currently in use: a stored override, or the .env default. */
export function getApiKey(): string {
  return getStoredApiKey() || import.meta.env.VITE_API_KEY || 'local-dev';
}

/** Persists an API key so it overrides the .env default on this and future visits. */
export function setApiKey(key: string): void {
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
  } catch {
    // localStorage unavailable (e.g. private browsing) — key still applies for this session.
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

/** Subscribes to 401 responses from the API. Returns an unsubscribe function. */
export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

export type ApiParams = Record<string, string | number | boolean | undefined | null>;

/**
 * Calls a GET endpoint on the DCM API and returns the parsed JSON body.
 *
 * @param path - Endpoint path, relative to the API base (e.g. "/case", "/evidence/1").
 * @param params - Query params to append (e.g. { 'sort-by': 'name' }).
 * @returns The parsed JSON response body.
 */
export async function get<T = unknown>(path: string, params: ApiParams = {}): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'api-key': getApiKey() }
  });

  if (response.status === 401) {
    unauthorizedListeners.forEach((listener) => listener());
    throw new UnauthorizedError(`GET ${url.pathname}${url.search} failed: 401 Unauthorized`);
  }

  if (!response.ok) {
    throw new Error(`GET ${url.pathname}${url.search} failed: ${response.status} ${response.statusText}`);
  }

  const body = await response.json();
  // The production API wraps payloads as { success, message, data, filters }; the local mock
  // returns them bare. Unwrap so callers see the same shape from both.
  if (body && typeof body === 'object' && !Array.isArray(body) && 'success' in body && 'data' in body) {
    return body.data as T;
  }
  return body as T;
}

const PAGE_SIZE = 200;

/**
 * Fetches every record from a paginated GET endpoint, following start/length until a short
 * page comes back.
 *
 * The API has no date-range filter, and its server-side sort doesn't reliably follow the dates
 * the dashboards use (e.g. a case's "Request Date" custom field), so callers fetch everything
 * and filter client-side (see isWithinDateRange).
 *
 * @param path - Endpoint path, relative to the API base (e.g. "/case").
 * @param params - Extra query params. start/length are managed internally.
 */
export async function getAllPages<T>(path: string, params: ApiParams = {}): Promise<T[]> {
  const results: T[] = [];
  let start = 0;

  while (true) {
    const page = await get<T[]>(path, { ...params, start, length: PAGE_SIZE });
    results.push(...page);
    if (page.length < PAGE_SIZE) break;
    start += PAGE_SIZE;
  }

  return results;
}

/** Whether `date` falls within [from, to] (inclusive). Missing or unparseable dates never match. */
export function isWithinDateRange(date: string | null | undefined, from: Date, to: Date): boolean {
  if (!date) return false;
  const parsed = new Date(date);
  return parsed >= from && parsed <= to;
}
