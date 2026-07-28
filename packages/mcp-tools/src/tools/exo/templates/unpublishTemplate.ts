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

export const UnpublishTemplateToolParams = BaseToolSchema.extend({
  templateId: z.string().describe('The ID of the template to unpublish'),
  version: z
    .number()
    .describe(
      "REQUIRED. The template's sys.version as returned by get_template. " +
        'You must call get_template first to read the current state and version. ' +
        'The unpublish is rejected if this does not match the current version, which means ' +
        'the template changed since you read it.',
    ),
});

type Params = z.infer<typeof UnpublishTemplateToolParams>;

export function unpublishTemplateTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      templateId: args.templateId,
    };

    const contentfulClient = createToolClient(config, args);

    // Read before write: the unpublish endpoint requires the current version.
    const current = await contentfulClient.template.get(params);

    // Enforce read-before-write: reject if the caller's version is stale.
    if (args.version !== current.sys.version) {
      throw new Error(
        `Version conflict: the template has changed since you read it ` +
          `(your version: ${args.version}, current version: ${current.sys.version}). ` +
          `Re-fetch the template with get_template and retry with the latest sys.version.`,
      );
    }

    const template = await contentfulClient.template.unpublish({
      ...params,
      version: args.version,
    });

    return createSuccessResponse('Template unpublished successfully', {
      template,
    });
  }

  return withErrorHandling(tool, 'Error unpublishing template');
}
