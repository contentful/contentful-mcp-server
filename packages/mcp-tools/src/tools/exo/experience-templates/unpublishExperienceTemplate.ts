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

export const UnpublishExperienceTemplateToolParams = BaseToolSchema.extend({
  experienceTemplateId: z
    .string()
    .describe('The ID of the experience template to unpublish'),
  version: z
    .number()
    .describe(
      "REQUIRED. The experience template's sys.version as returned by get_experience_template. " +
        'You must call get_experience_template first to read the current state and version. ' +
        'The unpublish is rejected if this does not match the current version, which means ' +
        'the experience template changed since you read it.',
    ),
});

type Params = z.infer<typeof UnpublishExperienceTemplateToolParams>;

export function unpublishExperienceTemplateTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      experienceTemplateId: args.experienceTemplateId,
    };

    const contentfulClient = createToolClient(config, args);

    // Read before write: the unpublish endpoint requires the current version.
    const current = await contentfulClient.experienceTemplate.get(params);

    // Enforce read-before-write: reject if the caller's version is stale.
    if (args.version !== current.sys.version) {
      throw new Error(
        `Version conflict: the experience template has changed since you read it ` +
          `(your version: ${args.version}, current version: ${current.sys.version}). ` +
          `Re-fetch the experience template with get_experience_template and retry with the latest sys.version.`,
      );
    }

    const experienceTemplate =
      await contentfulClient.experienceTemplate.unpublish({
        ...params,
        version: args.version,
      });

    return createSuccessResponse(
      'Experience template unpublished successfully',
      {
        experienceTemplate,
      },
    );
  }

  return withErrorHandling(tool, 'Error unpublishing experience template');
}
