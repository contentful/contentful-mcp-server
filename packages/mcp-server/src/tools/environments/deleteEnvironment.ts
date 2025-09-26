import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const DeleteEnvironmentToolParams = BaseToolSchema.extend({
  environmentId: z.string().describe('The ID of the environment to delete'),
});

type Params = z.infer<typeof DeleteEnvironmentToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

  // Delete the environment
  await contentfulClient.environment.delete(params);

  return createSuccessResponse('Environment deleted successfully', {
    environmentId: args.environmentId,
  });
}

export const deleteEnvironmentTool = withErrorHandling(
  tool,
  'Error deleting environment',
);
