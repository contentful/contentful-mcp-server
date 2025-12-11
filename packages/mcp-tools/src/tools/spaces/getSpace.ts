import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import ctfl from 'contentful-management';
import { createClientConfig } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const GetSpaceToolParams = z.object({
  spaceId: z.string().describe('The ID of the space to retrieve'),
});

type Params = z.infer<typeof GetSpaceToolParams>;

export function getSpaceTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    // Create a client without space-specific configuration
    const clientConfig = createClientConfig(config);
    // Remove space from config since we'll specify it in the get call
    delete clientConfig.space;
    const contentfulClient = ctfl.createClient(clientConfig, { type: 'plain' });

    // Get the space
    const space = await contentfulClient.space.get({
      spaceId: args.spaceId,
    });

    return createSuccessResponse('Space retrieved successfully', { space });
  }

  return withErrorHandling(tool, 'Error retrieving space');
}
