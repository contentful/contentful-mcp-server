// Set test environment variables before any imports
process.env.TEST_TYPE = 'unit';
process.env.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN = 'test-token';
process.env.CONTENTFUL_HOST = 'api.contentful.com';
process.env.SPACE_ID = 'test-space';
process.env.ENVIRONMENT_ID = 'master';

import { beforeEach } from 'vitest';

beforeEach(() => {
  // Ensure test environment variables are set for each test
  process.env.TEST_TYPE = 'unit';
  process.env.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN = 'test-token';
  process.env.CONTENTFUL_HOST = 'api.contentful.com';
  process.env.SPACE_ID = 'test-space';
  process.env.ENVIRONMENT_ID = 'master';
});
