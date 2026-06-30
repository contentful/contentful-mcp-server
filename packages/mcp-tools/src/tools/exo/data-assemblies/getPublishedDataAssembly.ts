import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const GetPublishedDataAssemblyToolParams = BaseToolSchema.extend({
  dataAssemblyId: z.string().describe('The ID of the published data assembly to retrieve'),
});

type Params = z.infer<typeof GetPublishedDataAssemblyToolParams>;

export function getPublishedDataAssemblyTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createToolClient(config, args);

    const dataAssembly = await contentfulClient.dataAssembly.getPublished({
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      dataAssemblyId: args.dataAssemblyId,
    });

    return createSuccessResponse('Published data assembly retrieved successfully', {
      dataAssembly,
    });
  }

  return withErrorHandling(tool, 'Error retrieving published data assembly');
}
