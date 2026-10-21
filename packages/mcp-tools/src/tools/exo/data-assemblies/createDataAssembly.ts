import { z } from 'zod';
import type * as ctfl from 'contentful-management';
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
    'Ordered parameter definitions with stable id and explicit boolean required (may be empty array)',
  ),
  resolvers: DataAssemblyResolverConfigSchema.describe(
    'Resolver definitions keyed by resolver name (may be empty object)',
  ),
  return: DataAssemblyReturnMappingConfigSchema.describe(
    'Return mapping configuration specifying how to map resolved data',
  ),
  dataType: z
    .array(DataAssemblyDataTypeFieldSchema)
    .describe(
      'Data type field definitions for this data assembly (may be empty array)',
    ),
  variant: z
    .string()
    .optional()
    .describe('Optional variant identifier for this data assembly'),
  metadata: DataAssemblyMetadataSchema.optional().describe(
    'Optional metadata (tags)',
  ),
});

type Params = z.infer<typeof CreateDataAssemblyToolParams>;

export function createDataAssemblyTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const contentfulClient = createExoToolClient(config, args);

    // Use the SDK's raw transport until its DataAssembly types support arrays.
    const dataAssembly = await contentfulClient.raw.post<unknown>(
      `/spaces/${args.spaceId}/environments/${args.environmentId}/data_assemblies`,
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
      } satisfies Omit<ctfl.CreateDataAssemblyProps, 'parameters'> & {
        parameters: z.infer<typeof DataAssemblyParameterConfigSchema>;
      },
    );

    return createSuccessResponse('Data assembly created successfully', {
      dataAssembly,
    });
  }

  return withErrorHandling(tool, 'Error creating data assembly');
}
