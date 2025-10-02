import { defineConfig } from 'vitest/config';
import path from 'path';

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
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    coverage: {
      include: ['src/**/*.{ts,tsx,js,jsx}'],
      exclude: ['node_modules', 'dist', '**/*.config.ts', '**/*.config.js'],
    },
  },
  resolve: {
    alias: {
      '@contentful/mcp-tools': path.resolve(
        __dirname,
        '../mcp-tools/src/index.ts',
      ),
    },
  },
});
