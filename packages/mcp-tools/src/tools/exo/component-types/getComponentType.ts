import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const GetComponentTypeToolParams = BaseToolSchema.extend({
  componentTypeId: z
    .string()
    .describe('The ID of the component type to retrieve details for'),
});

type Params = z.infer<typeof GetComponentTypeToolParams>;

export function getComponentTypeTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createToolClient(config, args);

    const componentType = await contentfulClient.componentType.get({
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      componentTypeId: args.componentTypeId,
    });

    return createSuccessResponse('Component type retrieved successfully', {
      componentType,
    });
  }

  return withErrorHandling(tool, 'Error retrieving component type');
}
