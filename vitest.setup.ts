import { version } from './package.json';
import { vi } from 'vitest';

// Set global version
global.__VERSION__ = version;

// Mock environment variables for testing
vi.mock('process', () => ({
  env: {
    CONTENTFUL_SPACE_ID: 'test-space-id',
    CONTENTFUL_ACCESS_TOKEN: 'test-access-token',
    CONTENTFUL_ENVIRONMENT_ID: 'test-environment',
  },
}));
