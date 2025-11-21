import type { ContentfulConfig } from '../config/types.js';

/**
 * Creates a mock ContentfulConfig for testing
 */
export function createMockConfig(
  overrides?: Partial<ContentfulConfig>,
): ContentfulConfig {
  return {
    accessToken: 'test-access-token',
    host: 'api.contentful.com',
    spaceId: 'test-space-id',
    environmentId: 'test-environment',
    organizationId: 'test-org-id',
    appId: 'test-app-id',
    ...overrides,
  };
}
