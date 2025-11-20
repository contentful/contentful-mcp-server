import ctfl from 'contentful-management';
import { ClientOptions } from 'contentful-management';
import { z } from 'zod';
import type { ContentfulConfig } from '../config/types.js';
import { getVersion } from './getVersion.js';

export const BaseToolSchema = z.object({
  spaceId: z.string().describe('The ID of the Contentful space'),
  environmentId: z.string().describe('The ID of the Contentful environment'),
});

/**
 * Creates a Contentful client configuration from ContentfulConfig
 *
 * @param config - Contentful configuration
 * @param params - Tool parameters that may include a resource
 * @returns Configured Contentful client
 */
export function createToolClient(
  config: ContentfulConfig,
  params: z.infer<typeof BaseToolSchema>,
) {
  const clientConfig: ClientOptions = {
    accessToken: config.accessToken,
    host: config.host ?? 'api.contentful.com',
    space: params.spaceId ?? config.spaceId,
    headers: {
      'X-Contentful-User-Agent-Tool': `contentful-mcp/${getVersion()}`,
    },
  };

  return ctfl.createClient(clientConfig, { type: 'plain' });
}

/**
 * Creates a Contentful client configuration from ContentfulConfig (for organization-level operations)
 *
 * @param config - Contentful configuration
 * @returns Configured Contentful client options (without space)
 */
export function createClientConfig(config: ContentfulConfig): ClientOptions {
  const clientConfig: ClientOptions = {
    accessToken: config.accessToken,
    host: config.host ?? 'api.contentful.com',
    headers: {
      'X-Contentful-User-Agent-Tool': `contentful-mcp/${getVersion()}`,
    },
  };

  return clientConfig;
}
