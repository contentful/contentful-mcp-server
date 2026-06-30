import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import {
  BaseToolSchema,
  createToolClient,
  assertEnvironmentNotProtected,
} from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const CreateDataAssemblyToolParams = BaseToolSchema.extend({
  name: z.string().describe('The name of the data assembly'),
  description: z.string().describe('Description of the data assembly'),
  parameters: z
    .record(z.unknown())
    .describe('Parameter definitions keyed by parameter name (may be empty object)'),
  resolvers: z
    .record(z.unknown())
    .describe('Resolver definitions keyed by resolver name (may be empty object)'),
  return: z
    .record(z.unknown())
    .describe('Return mapping configuration specifying how to map resolved data'),
  dataType: z
    .array(z.unknown())
    .describe('Data type field definitions for this data assembly (may be empty array)'),
  variant: z
    .string()
    .optional()
    .describe('Optional variant identifier for this data assembly'),
  metadata: z
    .object({
      tags: z.array(z.unknown()).optional(),
    })
    .optional()
    .describe('Optional metadata (tags)'),
});

type Params = z.infer<typeof CreateDataAssemblyToolParams>;

export function createDataAssemblyTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const contentfulClient = createToolClient(config, args);

    const dataAssembly = await contentfulClient.dataAssembly.create(
      { spaceId: args.spaceId, environmentId: args.environmentId },
      {
        sys: {
          type: 'DataAssembly',
          dataType: args.dataType as Parameters<typeof contentfulClient.dataAssembly.create>[1]['sys']['dataType'],
          ...(args.variant && { variant: args.variant }),
        },
        name: args.name,
        description: args.description,
        parameters: args.parameters as Parameters<typeof contentfulClient.dataAssembly.create>[1]['parameters'],
        resolvers: args.resolvers as Parameters<typeof contentfulClient.dataAssembly.create>[1]['resolvers'],
        return: args.return as Parameters<typeof contentfulClient.dataAssembly.create>[1]['return'],
        metadata: (args.metadata ?? { tags: [] }) as Parameters<typeof contentfulClient.dataAssembly.create>[1]['metadata'],
      },
    );

    return createSuccessResponse('Data assembly created successfully', {
      dataAssembly,
    });
  }

  return withErrorHandling(tool, 'Error creating data assembly');
}
