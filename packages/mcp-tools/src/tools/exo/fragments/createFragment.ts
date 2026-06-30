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

export const CreateFragmentToolParams = BaseToolSchema.extend({
  name: z.string().describe('The name of the fragment'),
  description: z.string().describe('Description of the fragment'),
  componentType: z
    .object({
      sys: z.object({
        type: z.literal('ResourceLink'),
        linkType: z.literal('Contentful:ComponentType'),
        urn: z.string(),
      }),
    })
    .describe('Resource link to the component type this fragment is based on'),
  viewports: z.array(z.unknown()).describe('Viewport definitions (may be empty)'),
  designProperties: z
    .record(z.unknown())
    .describe('Design property values keyed by property ID (may be empty object)'),
  contentBindings: z
    .record(z.unknown())
    .optional()
    .describe('Optional content bindings for the fragment'),
  slots: z
    .record(z.array(z.unknown()))
    .optional()
    .describe('Optional slot node definitions keyed by slot ID'),
  metadata: z
    .object({
      tags: z.array(z.unknown()).optional(),
      concepts: z.array(z.unknown()).optional(),
    })
    .optional()
    .describe('Optional ExO metadata (tags, concepts)'),
});

type Params = z.infer<typeof CreateFragmentToolParams>;

export function createFragmentTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const contentfulClient = createToolClient(config, args);

    const fragment = await contentfulClient.fragment.create(
      { spaceId: args.spaceId, environmentId: args.environmentId },
      {
        name: args.name,
        description: args.description,
        componentType: args.componentType,
        viewports: args.viewports,
        designProperties: args.designProperties,
        ...(args.contentBindings && { contentBindings: args.contentBindings }),
        ...(args.slots && { slots: args.slots }),
        ...(args.metadata && { metadata: args.metadata }),
      } as Parameters<typeof contentfulClient.fragment.create>[1],
    );

    return createSuccessResponse('Fragment created successfully', {
      fragment,
    });
  }

  return withErrorHandling(tool, 'Error creating fragment');
}
