import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import {
  BaseToolSchema,
  createExoToolClient,
  assertEnvironmentNotProtected,
} from '../../../utils/tools.js';
import {
  DataAssemblyParameterConfigSchema,
  DataAssemblyResolverConfigSchema,
  DataAssemblyReturnMappingConfigSchema,
  DataAssemblyDataTypeFieldSchema,
  DataAssemblyMetadataSchema,
} from '../../../types/dataAssemblySchemas.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const CreateDataAssemblyToolParams = BaseToolSchema.extend({
  name: z.string().describe('The name of the data assembly'),
  description: z.string().describe('Description of the data assembly'),
  parameters: DataAssemblyParameterConfigSchema.describe(
    'Parameter definitions keyed by parameter name (may be empty object)',
  ),
  resolvers: DataAssemblyResolverConfigSchema.describe(
    'Resolver definitions keyed by resolver name (may be empty object)',
  ),
  return: DataAssemblyReturnMappingConfigSchema.describe(
    'Return mapping configuration specifying how to map resolved data',
  ),
  dataType: z
    .array(DataAssemblyDataTypeFieldSchema)
    .describe('Data type field definitions for this data assembly (may be empty array)'),
  variant: z
    .string()
    .optional()
    .describe('Optional variant identifier for this data assembly'),
  metadata: DataAssemblyMetadataSchema.optional().describe('Optional metadata (tags)'),
});

type Params = z.infer<typeof CreateDataAssemblyToolParams>;

export function createDataAssemblyTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const contentfulClient = createExoToolClient(config, args);

    const dataAssembly = await contentfulClient.dataAssembly.create(
      { spaceId: args.spaceId, environmentId: args.environmentId },
      {
        sys: {
          type: 'DataAssembly',
          dataType: args.dataType,
          ...(args.variant && { variant: args.variant }),
        },
        name: args.name,
        description: args.description,
        parameters: args.parameters,
        resolvers: args.resolvers,
        return: args.return,
        metadata: args.metadata ?? { tags: [] },
      },
    );

    return createSuccessResponse('Data assembly created successfully', {
      dataAssembly,
    });
  }

  return withErrorHandling(tool, 'Error creating data assembly');
}
