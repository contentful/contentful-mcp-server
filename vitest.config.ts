import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    restoreMocks: true,
    env: {
      TEST_TYPE: 'unit',
    },
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      include: ['src/**/*.{ts,tsx,js,jsx}'],
    },
  },
});
