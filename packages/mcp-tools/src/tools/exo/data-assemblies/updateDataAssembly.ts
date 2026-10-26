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
  parseDataAssemblyParameterResponse,
  type DataAssemblyParameterConfig,
  type DataAssemblyParameterResponse,
} from '../../../types/dataAssemblySchemas.js';
import type { ContentfulConfig } from '../../../config/types.js';
import { dataAssembliesPath } from './client.js';

export const UpdateDataAssemblyToolParams = BaseToolSchema.extend({
  dataAssemblyId: z.string().describe('The ID of the data assembly to update'),
  version: z
    .number()
    .describe(
      "REQUIRED. The data assembly's sys.version as returned by get_data_assembly. " +
        'You must call get_data_assembly first to read the current state and version. ' +
        'The update is rejected if this does not match the current version, which means ' +
        'the data assembly changed since you read it.',
    ),
  name: z.string().optional().describe('The name of the data assembly'),
  description: z
    .string()
    .optional()
    .describe('Description of the data assembly'),
  parameters: DataAssemblyParameterConfigSchema.optional().describe(
    'Ordered parameter definitions with stable id and explicit boolean required; replaces existing if provided',
  ),
  resolvers: DataAssemblyResolverConfigSchema.optional().describe(
    'Resolver definitions; replaces existing if provided',
  ),
  return: DataAssemblyReturnMappingConfigSchema.optional().describe(
    'Return mapping configuration; replaces existing if provided',
  ),
  metadata: DataAssemblyMetadataSchema.optional().describe(
    'Metadata (tags); replaces existing if provided',
  ),
}).strict();

type Params = z.infer<typeof UpdateDataAssemblyToolParams>;

export function updateDataAssemblyTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      dataAssemblyId: args.dataAssemblyId,
    };

    const contentfulClient = createExoToolClient(config, args);

    // Read before write: fetch current state to preserve fields the caller did not supply.
    const current = await contentfulClient.dataAssembly.get(params);

    // Enforce read-before-write: the caller must supply the version it read.
    if (args.version !== current.sys.version) {
      throw new Error(
        `Version conflict: the data assembly has changed since you read it ` +
          `(your version: ${args.version}, current version: ${current.sys.version}). ` +
          `Re-fetch the data assembly with get_data_assembly and retry the update with the latest sys.version.`,
      );
    }

    const parameters =
      args.parameters ?? parseDataAssemblyParameterResponse(current.parameters);

    // Mirror the SDK update's version header while sending canonical arrays.
    const dataAssembly = await contentfulClient.raw.put<unknown>(
      `${dataAssembliesPath(args.spaceId, args.environmentId)}/${args.dataAssemblyId}`,
      {
        name: args.name ?? current.name,
        description: args.description ?? current.description,
        parameters,
        resolvers: args.resolvers ?? current.resolvers,
        return: args.return ?? current.return,
        metadata: args.metadata ?? current.metadata,
      } satisfies Omit<ctfl.UpdateDataAssemblyProps, 'parameters'> & {
        parameters: DataAssemblyParameterConfig | DataAssemblyParameterResponse;
      },
      { headers: { 'X-Contentful-Version': current.sys.version } },
    );

    return createSuccessResponse('Data assembly updated successfully', {
      dataAssembly,
    });
  }

  return withErrorHandling(tool, 'Error updating data assembly');
}
