import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    restoreMocks: true,
    env: {
      TEST_TYPE: 'unit',
      CONTENTFUL_MANAGEMENT_ACCESS_TOKEN: 'test_token',
      SPACE_ID: 'test_space_id',
      ENVIRONMENT_ID: 'master',
      CONTENTFUL_HOST: 'api.contentful.com',
    },
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      include: ['src/**/*.{ts,tsx,js,jsx}'],
    },
  },
});
