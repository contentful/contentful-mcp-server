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
  description: z.string().optional().describe('Description of the data assembly'),
  parameters: z
    .record(z.unknown())
    .optional()
    .describe('Parameter definitions; replaces existing if provided'),
  resolvers: z
    .record(z.unknown())
    .optional()
    .describe('Resolver definitions; replaces existing if provided'),
  return: z
    .unknown()
    .optional()
    .describe('Return mapping configuration; replaces existing if provided'),
  dataType: z
    .array(z.unknown())
    .optional()
    .describe('Data type field definitions; replaces existing if provided'),
  variant: z
    .string()
    .optional()
    .describe('Optional variant identifier; replaces existing if provided'),
  metadata: z
    .object({
      tags: z.array(z.unknown()).optional(),
    })
    .optional()
    .describe('Metadata (tags); replaces existing if provided'),
});

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

    const contentfulClient = createToolClient(config, args);

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

    type UpdatePayload = Parameters<typeof contentfulClient.dataAssembly.update>[1];

    const dataAssembly = await contentfulClient.dataAssembly.update(params, {
      sys: {
        id: current.sys.id,
        type: 'DataAssembly',
        version: current.sys.version,
        dataType: (args.dataType ?? current.sys.dataType) as UpdatePayload['sys']['dataType'],
        ...(args.variant !== undefined
          ? { variant: args.variant }
          : current.sys.variant !== undefined
          ? { variant: current.sys.variant }
          : {}),
      },
      name: args.name ?? current.name,
      description: args.description ?? current.description,
      parameters: (args.parameters ?? current.parameters) as UpdatePayload['parameters'],
      resolvers: (args.resolvers ?? current.resolvers) as UpdatePayload['resolvers'],
      return: (args.return ?? current.return) as UpdatePayload['return'],
      metadata: (args.metadata ?? current.metadata) as UpdatePayload['metadata'],
    });

    return createSuccessResponse('Data assembly updated successfully', {
      dataAssembly,
    });
  }

  return withErrorHandling(tool, 'Error updating data assembly');
}
