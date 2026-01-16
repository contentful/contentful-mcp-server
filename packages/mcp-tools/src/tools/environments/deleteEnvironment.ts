import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const DeleteEnvironmentToolParams = BaseToolSchema.extend({
  environmentId: z.string().describe('The ID of the environment to delete'),
});

type Params = z.infer<typeof DeleteEnvironmentToolParams>;

export function deleteEnvironmentTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
    };

    const contentfulClient = await createToolClient(config, args);

  // Delete the environment
  await contentfulClient.environment.delete(params);

    return createSuccessResponse('Environment deleted successfully', {
      environmentId: args.environmentId,
    });
  }

  return withErrorHandling(tool, 'Error deleting environment');
}
