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
import {
  createReleaseEntities,
  ReleaseEntityLinkSchema,
} from './releaseEntities.js';

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
        entities: createReleaseEntities(args.entities),
      },
    );

    return createSuccessResponse('Release created successfully', { release });
  }

  return withErrorHandling(tool, 'Error creating release');
}
