import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema, createExoToolClient } from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const GetDesignTokenToolParams = BaseToolSchema.extend({
  designTokenId: z
    .string()
    .describe('The ID of the design token to retrieve details for'),
});

type Params = z.infer<typeof GetDesignTokenToolParams>;

export function getDesignTokenTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createExoToolClient(config, args);

    const designToken = await contentfulClient.designToken.get({
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      designTokenId: args.designTokenId,
    });

    return createSuccessResponse('Design token retrieved successfully', {
      designToken,
    });
  }

  return withErrorHandling(tool, 'Error retrieving design token');
}
