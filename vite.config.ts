import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    // The api/ directory is a separate Node project with its own vitest setup; only this
    // project's own src/ tests should run here.
    exclude: [...configDefaults.exclude, 'api/**'],
  },
})
