import { loadEnv } from 'vite'
import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [react()],
    server: {
      // Remote APIs that don't answer CORS preflights can't be called from the browser directly.
      // When API_PROXY_TARGET is set, the dev server forwards /service/* to it, so the browser
      // only ever talks to its own origin (set VITE_API_BASE_URL to a relative path like /service/api/v1).
      proxy: env.API_PROXY_TARGET
        ? { '/service': { target: env.API_PROXY_TARGET, changeOrigin: true, secure: true } }
        : undefined,
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      // Keep tests independent of whatever the local .env points at.
      env: { VITE_API_BASE_URL: '', VITE_API_KEY: '' },
      // The api/ directory is a separate Node project with its own vitest setup; only this
      // project's own src/ tests should run here.
      exclude: [...configDefaults.exclude, 'api/**'],
    },
  }
})
