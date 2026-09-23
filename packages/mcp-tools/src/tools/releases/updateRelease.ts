import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import {
  BaseToolSchema,
  createToolClient,
  assertEnvironmentNotProtected,
} from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

const ReleaseEntityLinkSchema = z.object({
  id: z.string().describe('The ID of the Entry or Asset'),
  linkType: z
    .enum(['Entry', 'Asset'])
    .describe('The type of entity being linked'),
});

export const UpdateReleaseToolParams = BaseToolSchema.extend({
  releaseId: z.string().describe('The ID of the release to update'),
  title: z
    .string()
    .optional()
    .describe('The new title of the release. Omit to keep the existing title.'),
  entities: z
    .array(ReleaseEntityLinkSchema)
    .optional()
    .describe(
      'The full replacement list of Entries/Assets for the release. Omit to keep the existing entities.',
    ),
});

type Params = z.infer<typeof UpdateReleaseToolParams>;

export function updateReleaseTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      releaseId: args.releaseId,
    };

    const contentfulClient = createToolClient(config, args);

    const existingRelease = await contentfulClient.release.get(params);

    const entities = args.entities
      ? {
          sys: { type: 'Array' as const },
          items: args.entities.map((entity) => ({
            sys: {
              type: 'Link' as const,
              linkType: entity.linkType,
              id: entity.id,
            },
          })),
        }
      : existingRelease.entities;

    const updatedRelease = await contentfulClient.release.update(
      { ...params, version: existingRelease.sys.version },
      {
        title: args.title ?? existingRelease.title,
        entities,
      },
    );

    return createSuccessResponse('Release updated successfully', {
      release: updatedRelease,
    });
  }

  return withErrorHandling(tool, 'Error updating release');
}
