# DCM Mock API

A Node.js/Express mock server that emulates the endpoints described in `dcm-api-v1-openapi.yaml` (the DCM V1 OpenAPI spec), backed by in-memory, faker-generated dummy data. Use it while developing the frontend so you don't need the real DCM backend running.

## Running

```bash
npm install
npm run dev    # nodemon, restarts on change
# or
npm start
```

Server listens on `http://localhost:8000` (override with `PORT`). All API routes are mounted under:

```
http://localhost:8000/service/api/v1
```

This matches the `baseUrl` variable in the Postman collection, so you can point Postman at `localhost:8000` and everything should just work.

## Testing

```bash
npm test          # run once
npm run test:watch
```

Uses Vitest with Supertest for route-level integration tests, plus unit tests for the auth middleware and the list/pagination/dynamic-field helpers.

## Auth

Every route under `/service/api/v1` requires an `api-key` header (mirrors the spec's `api-key` security scheme):

```bash
curl -H "api-key: anything" http://localhost:8000/service/api/v1/case
```

Any non-empty value is accepted — there's no real credential checking, it just guards against requests that forgot the header entirely. Missing header → `401`.

## Data

Data lives only in memory (`src/data/store.js`) and resets on server restart. It's seeded with a fixed faker seed, so the same IDs/records come back every time you restart — nothing will shift under you between dev sessions.

Static reference/lookup values (roles, groups, case types, expense types, etc.) live in `src/data/lookups.js`.

### Dynamic custom fields

The real DCM API attaches a dynamic, per-deployment set of custom fields to **Case**, **Evidence** (one set per evidence type — Camera, Laptop, Vehicle, etc.), and **Chain of Custody** (one set per intake/exchange/disposal) records. Each field is keyed `"<groupId>_<fieldId>"` (e.g. `"26_1991"` = Camera's "Make" field) and record responses carry them in a `fields` (and, for Evidence, `evidence_type_fields`) object as `{ field_id, value }` pairs.

The full set of group/field definitions — extracted from `dcm-api-v1-openapi.yaml`'s schemas — lives in `src/data/dynamicFields.js` (auto-generated; see the header comment for regeneration notes). `src/utils/dynamicFields.js` has the helpers that build fake field values (`buildFieldsBag`), apply request-body overrides (`applyFieldOverrides`), and render the `/case/form`, `/evidence/form/:id`, and `/chain-of-custody/*/form` descriptor responses (`formDescriptor`).

Create/update/delete requests mutate the in-memory arrays directly, so you can round-trip data within a session (e.g. create a case, then fetch it by ID).

## List endpoints

Any endpoint returning a collection (`/user`, `/case`, `/evidence`, `/log`, etc.) supports the same query params as the spec's `ApiFilterParams`:

| param            | description                              |
|-------------------|-------------------------------------------|
| `start`           | offset of the first record (default `0`)  |
| `length`          | max records to return (default: all)      |
| `sort-by`         | field name to sort by                     |
| `sort-direction`  | `asc` (default) or `desc`                 |
| `full-response`   | `1`/`true` — see below                    |

By default (matching the spec's documented response schemas) list endpoints return a **plain JSON array** of items, sliced/sorted per the params above. The spec doesn't document a shape for `full-response=true`; here it's interpreted as "include pagination metadata" and wraps the array:

```json
{ "data": [ /* items */ ], "total": 40, "start": 0, "length": 10, "recordsTotal": 40, "recordsFiltered": 40 }
```

Single-item `GET`, `POST`, `PUT` endpoints return the resource object directly. `DELETE` returns the removed (or, for `/agency/:id` and `/user/:id`, soft-disabled) resource. Missing records return `404 { "error": "..." }`.

## Endpoint coverage

Mirrors every path in `dcm-api-v1-openapi.yaml`:

- **User** — `/group`, `/role`, `/user`, `/user/:id`, `/user/by-role/:id`, `/me`
- **Case** — `/case`, `/case/type`, `/case/permission`, `/case/form`, `/case/:id`, `/case/by-case-number/:id`
- **Evidence** — `/evidence`, `/evidence/type`, `/evidence/form/:id`, `/evidence/:caseId` (create), `/evidence/:id`
- **Asset** — `/asset`, `/asset/:id`, `/grant`, `/grant/:id` (read-only, matching the spec — no create/update)
- **Agency** — `/agency`, `/agency/state`, `/agency/:id`
- **Expense** — `/expense`, `/expense/:id`, `/expense/case/:id`, `/expense/consumable`, `/expense/labor`, `/expense/type`, `/expense/department`
- **Memo** — `/memo`, `/memo/type`, `/memo/:id`, `/memo/case/:id`
- **Forensic Tool** — `/forensic-tool`, `/forensic-tool/:id`, `/forensic-tool/exam-result`, `/forensic-tool/forensic-software`
- **Chain of Custody** — `/chain-of-custody`, `/chain-of-custody/:id`, plus `intake`/`exchange`/`disposal` `reason`/`type`/`form` sub-routes
- **Log** — `/log`

A few endpoints in the spec have schema refs that look like copy/paste documentation errors (e.g. the six chain-of-custody `reason`/`type` endpoints, and `/forensic-tool/forensic-software`, all reference schemas describing unrelated resources). Those are implemented with a sensible `{id, value}`/catalog shape instead of literally following the broken ref — see the comments above the relevant `lookups.js` entries.

## Adding/adjusting dummy data

- Edit `src/data/store.js` to change how many records are generated or their shape.
- Edit `src/data/lookups.js` for static reference values (dropdown options, types, reasons).
- Edit `src/data/dynamicFields.js` for the Case/Evidence/Chain-of-Custody custom-field definitions (auto-generated from the OpenAPI spec — see its header comment).
- Edit `src/utils/dynamicFields.js` to change how fake values are generated for a given field `type`.

Route handlers live in `src/routes/*.routes.js`, one file per resource.
