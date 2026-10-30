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
  DataAssemblyMetadataSchema,
} from '../../../types/dataAssemblySchemas.js';
import type { ContentfulConfig } from '../../../config/types.js';
import { dataAssembliesPath } from './client.js';

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
  metadata: DataAssemblyMetadataSchema.optional().describe(
    'Optional metadata (tags)',
  ),
}).strict();

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
      dataAssembliesPath(args.spaceId, args.environmentId),
      {
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
