import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**', 'src/hooks/**'],
      // db.ts (Prisma singleton), auth.ts (NextAuth wiring), and env.ts
      // (module-load validation) are framework/boundary code — covered by
      // integration/E2E, not unit tests (see CLAUDE.md testing rules).
      exclude: [
        'src/generated/**',
        '**/*.d.ts',
        'src/lib/db.ts',
        'src/lib/auth.ts',
        'src/lib/env.ts',
      ],
      thresholds: { lines: 80, functions: 80 },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
