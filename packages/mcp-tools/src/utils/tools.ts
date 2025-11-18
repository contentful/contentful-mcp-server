import ctfl from 'contentful-management';
import { getDefaultClientConfig } from '../config/contentful.js';
import { z } from 'zod';

export const BaseToolSchema = z.object({
  spaceId: z.string().describe('The ID of the Contentful space'),
  environmentId: z.string().describe('The ID of the Contentful environment'),
});

/**
 * Creates a Contentful client with the correct configuration based on resource parameters
 *
 * @param params - Tool parameters that may include a resource
 * @returns Configured Contentful client
 */
export function createToolClient(params: z.infer<typeof BaseToolSchema>) {
  const clientConfig = getDefaultClientConfig();

  if (params.spaceId) {
    clientConfig.space = params.spaceId;
  }

  return ctfl.createClient(clientConfig, { type: 'plain' });
}
