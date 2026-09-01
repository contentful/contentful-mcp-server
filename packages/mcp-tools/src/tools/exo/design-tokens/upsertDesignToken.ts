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
  ExoMetadataSchema,
  DTCG_DESIGN_PROPERTY_TYPES,
} from '../../../types/exoSchemas.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const UpsertDesignTokenToolParams = BaseToolSchema.extend({
  designTokenId: z
    .string()
    .describe('The ID of the design token to create or update'),
  version: z
    .number()
    .optional()
    .describe(
      "The design token's sys.version, required when updating an existing token. " +
        'You must call get_design_token first to read the current state and version. ' +
        'The update is rejected if this does not match the current version, which means ' +
        'the token changed since you read it. Omit this entirely to create a new design ' +
        'token with this designTokenId — in that case name and type are required. Design ' +
        'tokens have no separate publish step: every upsert auto-publishes server-side, ' +
        'which bumps sys.version by 2 (not 1) per call.',
    ),
  name: z
    .string()
    .optional()
    .describe('The name of the design token; required when creating'),
  type: z
    .enum(DTCG_DESIGN_PROPERTY_TYPES)
    .optional()
    .describe('The DTCG type of the design token; required when creating'),
  metadata: ExoMetadataSchema.optional().describe(
    'ExO metadata (tags, concepts); replaces existing if provided',
  ),
});

type Params = z.infer<typeof UpsertDesignTokenToolParams>;

export function upsertDesignTokenTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      designTokenId: args.designTokenId,
    };

    const contentfulClient = createExoToolClient(config, args);

    // A version means this is an update: read the current token first (read-before-write),
    // reject a stale version, and fall back to the current fields for anything the caller
    // didn't supply. No version means this is a create — design tokens have no separate
    // create tool, so upsert has to handle both.
    if (args.version !== undefined) {
      const current = await contentfulClient.designToken.get(params);

      if (args.version !== current.sys.version) {
        throw new Error(
          `Version conflict: the design token has changed since you read it ` +
            `(your version: ${args.version}, current version: ${current.sys.version}). ` +
            `Re-fetch the design token with get_design_token and retry the update with the latest sys.version.`,
        );
      }

      const designToken = await contentfulClient.designToken.upsert(params, {
        sys: {
          id: current.sys.id,
          type: 'DesignToken',
          version: current.sys.version,
        },
        name: args.name ?? current.name,
        type: args.type ?? current.type,
        ...((args.metadata ?? current.metadata) && {
          metadata: args.metadata ?? current.metadata,
        }),
      });

      return createSuccessResponse('Design token updated successfully', {
        designToken,
      });
    }

    if (!args.name || !args.type) {
      throw new Error(
        'name and type are required when creating a new design token (no version supplied).',
      );
    }

    const designToken = await contentfulClient.designToken.upsert(params, {
      sys: { id: args.designTokenId, type: 'DesignToken' },
      name: args.name,
      type: args.type,
      ...(args.metadata && { metadata: args.metadata }),
    });

    return createSuccessResponse('Design token created successfully', {
      designToken,
    });
  }

  return withErrorHandling(tool, 'Error upserting design token');
}
