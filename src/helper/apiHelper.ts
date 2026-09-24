// Thin wrapper around the DCM API (see api/dcm-api-v1-openapi.yaml). Only GET is implemented
// since that's all the frontend needs right now.
//
// Configure via a .env file (see Vite's env docs):
//   VITE_API_BASE_URL=http://localhost:8000/service/api/v1
//   VITE_API_KEY=local-dev

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
 * @param params - Query params to append (e.g. { 'sort-by': 'requested_date' }).
 * @returns The parsed JSON response body.
 */
export async function get<T = unknown>(path: string, params: ApiParams = {}): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`);
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

  return response.json();
}

export type ApiRecord = Record<string, unknown>;

const DATE_RANGE_PAGE_SIZE = 200;

/**
 * Fetches every record from a GET endpoint whose `dateField` falls within
 * [dateFrom, dateTo] (inclusive).
 *
 * The API has no date-range filter, so this pages through the endpoint sorted
 * ascending by `dateField` (via the existing start/length pagination) and stops
 * as soon as a page's records pass `dateTo` or the endpoint runs out of records.
 * Note this scans from the start of the sort order, so it's most efficient when
 * `dateFrom` isn't far past the oldest record.
 *
 * @param path - Endpoint path, relative to the API base (e.g. "/case").
 * @param params - Extra query params (e.g. other filters). start/length/sort-by/
 *   sort-direction are managed internally and will be overridden if passed here.
 * @param dateField - Name of the field to sort and filter by (e.g. "requested_date").
 * @param dateFrom - Inclusive lower bound of the date range.
 * @param dateTo - Inclusive upper bound of the date range.
 */
export async function getAllByDateRange<T extends ApiRecord = ApiRecord>(
  path: string,
  params: ApiParams,
  dateField: string,
  dateFrom: Date,
  dateTo: Date
): Promise<T[]> {
  const results: T[] = [];
  let start = 0;

  while (true) {
    const page = await get<T[]>(path, {
      ...params,
      start,
      length: DATE_RANGE_PAGE_SIZE,
      'sort-by': dateField,
      'sort-direction': 'asc'
    });

    if (page.length === 0) break;

    for (const record of page) {
      const recordDate = new Date(record[dateField] as string);
      if (recordDate >= dateFrom && recordDate <= dateTo) {
        results.push(record as T);
      }
    }

    const lastDate = new Date(page[page.length - 1][dateField] as string);
    if (lastDate > dateTo || page.length < DATE_RANGE_PAGE_SIZE) break;

    start += DATE_RANGE_PAGE_SIZE;
  }

  return results;
}
