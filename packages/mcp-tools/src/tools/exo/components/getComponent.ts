import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema, createExoToolClient } from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const GetComponentToolParams = BaseToolSchema.extend({
  componentId: z
    .string()
    .describe('The ID of the component to retrieve details for'),
});

type Params = z.infer<typeof GetComponentToolParams>;

export function getComponentTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createExoToolClient(config, args);

    const component = await contentfulClient.component.get({
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      componentId: args.componentId,
    });

    return createSuccessResponse('Component retrieved successfully', {
      component,
    });
  }

  return withErrorHandling(tool, 'Error retrieving component');
}
