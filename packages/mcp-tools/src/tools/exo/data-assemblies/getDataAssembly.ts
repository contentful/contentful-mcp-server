import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const GetDataAssemblyToolParams = BaseToolSchema.extend({
  dataAssemblyId: z.string().describe('The ID of the data assembly to retrieve'),
});

type Params = z.infer<typeof GetDataAssemblyToolParams>;

export function getDataAssemblyTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createToolClient(config, args);

    const dataAssembly = await contentfulClient.dataAssembly.get({
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      dataAssemblyId: args.dataAssemblyId,
    });

    return createSuccessResponse('Data assembly retrieved successfully', {
      dataAssembly,
    });
  }

  return withErrorHandling(tool, 'Error retrieving data assembly');
}
