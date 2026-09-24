# DCM Dashboard

A single-page React/TypeScript dashboard for the DCM API. It visualizes **Case** and **Evidence** records as charts (by type, status, agency, and user, plus trends over time), with date-range/user/agency filtering, a light/dark theme toggle, and drill-down record tables. Built with Vite, React Router, and Chart.js.

## Requirements

- Node.js 20+ and npm
- A running DCM API to point the dashboard at (see [`api/README.md`](api/README.md) for a local mock API you can use instead)

## Local development

```bash
npm install
npm run dev
```

The dev server starts on `http://localhost:5173` (Vite's default).

Configure the API connection with a `.env` file at the project root:

```bash
VITE_API_BASE_URL=http://localhost:8000/service/api/v1
VITE_API_KEY=local-dev
```

Both are optional — without them the app falls back to the local mock API's defaults (`http://localhost:8000/service/api/v1` and `local-dev`). If the configured key is rejected (`401`), the app shows an "API key required" prompt and lets you enter a key at runtime, which is then stored in the browser (`localStorage`) and used for subsequent requests.

## Testing

```bash
npm test          # run once
npm run test:watch
```

Uses Vitest with React Testing Library (jsdom environment). Covers the pure helpers (`dateRangeHelper`, `apiHelper`, `evidenceApiHelper`, `userApiHelper`) and key components (`ApiKeyGate`, `ThemeToggle`, `Filter`).

## Build

```bash
npm run build
```

This runs a TypeScript project build (`tsc -b`) followed by `vite build`, producing a static, deployable bundle in `dist/`.

To sanity-check the production build locally before deploying:

```bash
npm run preview
```

## Deployment

The app is a static single-page app (SPA) — after `npm run build`, `dist/` contains everything needed to serve it. Deploy it behind any static file host or web server.

1. **Set the API connection at build time.** `VITE_API_BASE_URL` and `VITE_API_KEY` are baked into the bundle when `npm run build` runs (Vite inlines `import.meta.env.*` at build time), so set them in your CI/deploy environment (or a `.env.production` file) *before* building, pointing at the production DCM API:

   ```bash
   VITE_API_BASE_URL=https://api.example.com/service/api/v1 npm run build
   ```

   If `VITE_API_KEY` isn't baked in, users will be prompted for one on first load (see above).

2. **Upload `dist/` to your host.** For example:
   - **Static hosting (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3+CloudFront, etc.):** point the host at the `dist/` directory as the publish/output folder.
   - **Your own server (Nginx/Apache):** copy the contents of `dist/` to the server's web root.

3. **Configure SPA fallback routing.** The app uses client-side routing (`/`, `/case`, `/evidence`), so the server must serve `index.html` for any unmatched path instead of returning a 404 — otherwise a hard refresh or direct link to `/evidence` will break. Most static hosts have a built-in SPA/"rewrite all to index.html" option; for Nginx:

   ```nginx
   location / {
     try_files $uri /index.html;
   }
   ```

4. **Ensure the DCM API allows cross-origin requests** from the dashboard's origin (CORS), since the app calls it directly from the browser.

5. **Serve over HTTPS** in production, since the API key is sent on every request via the `api-key` header.

No server-side runtime is required — the built app is entirely static.
