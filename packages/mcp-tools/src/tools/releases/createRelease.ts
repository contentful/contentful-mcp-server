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

export const CreateReleaseToolParams = BaseToolSchema.extend({
  title: z.string().describe('The title of the release'),
  entities: z
    .array(ReleaseEntityLinkSchema)
    .describe('The Entries and/or Assets to include in the release'),
});

type Params = z.infer<typeof CreateReleaseToolParams>;

export function createReleaseTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const contentfulClient = createToolClient(config, args);

    const release = await contentfulClient.release.create(
      {
        spaceId: args.spaceId,
        environmentId: args.environmentId,
      },
      {
        title: args.title,
        entities: {
          sys: { type: 'Array' },
          items: args.entities.map((entity) => ({
            sys: {
              type: 'Link' as const,
              linkType: entity.linkType,
              id: entity.id,
            },
          })),
        },
      },
    );

    return createSuccessResponse('Release created successfully', { release });
  }

  return withErrorHandling(tool, 'Error creating release');
}
