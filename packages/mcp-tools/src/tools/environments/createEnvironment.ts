import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const CreateEnvironmentToolParams = BaseToolSchema.extend({
  environmentId: z.string().describe('The ID of the environment to create'),
  name: z.string().describe('The name of the environment to create'),
});

type Params = z.infer<typeof CreateEnvironmentToolParams>;

async function tool(args: Params) {
  const contentfulClient = createToolClient(args);

  // Create the environment
  const environment = await contentfulClient.environment.createWithId(
    {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
    },
    {
      name: args.name,
    },
  );

  return createSuccessResponse('Environment created successfully', {
    environment,
  });
}

export const createEnvironmentTool = withErrorHandling(
  tool,
  'Error creating environment',
);
