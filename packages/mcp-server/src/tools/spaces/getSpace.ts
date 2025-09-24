import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import ctfl from 'contentful-management';
import { getDefaultClientConfig } from '../../config/contentful.js';

export const GetSpaceToolParams = z.object({
  spaceId: z.string().describe('The ID of the space to retrieve'),
});

type Params = z.infer<typeof GetSpaceToolParams>;

async function tool(args: Params) {
  // Create a client without space-specific configuration
  const clientConfig = getDefaultClientConfig();
  // Remove space from config since we'll specify it in the get call
  delete clientConfig.space;
  const contentfulClient = ctfl.createClient(clientConfig, { type: 'plain' });

  // Get the space
  const space = await contentfulClient.space.get({
    spaceId: args.spaceId,
  });

  return createSuccessResponse('Space retrieved successfully', { space });
}

export const getSpaceTool = withErrorHandling(tool, 'Error retrieving space');
