import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const CreateEnvironmentToolParams = BaseToolSchema.extend({
  environmentId: z.string().describe('The ID of the environment to create'),
  name: z.string().describe('The name of the environment to create'),
  sourceEnvironmentId: z
    .string()
    .describe('The ID of the source environment to create')
    .optional(),
});

type Params = z.infer<typeof CreateEnvironmentToolParams>;

export function createEnvironmentTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createToolClient(config, args);

    // Create the environment
    const environment = await contentfulClient.environment.createWithId(
      {
        spaceId: args.spaceId,
        environmentId: args.environmentId,
      },
      {
        name: args.name,
      },
      args.sourceEnvironmentId
        ? { 'X-Contentful-Source-Environment': args.sourceEnvironmentId }
        : undefined,
    );

    return createSuccessResponse('Environment created successfully', {
      environment,
    });
  }

  return withErrorHandling(tool, 'Error creating environment');
}
