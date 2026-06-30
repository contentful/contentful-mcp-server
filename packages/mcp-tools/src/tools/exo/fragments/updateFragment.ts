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

export const UpdateFragmentToolParams = BaseToolSchema.extend({
  fragmentId: z.string().describe('The ID of the fragment to update'),
  version: z
    .number()
    .describe(
      "REQUIRED. The fragment's sys.version as returned by get_fragment. " +
        'You must call get_fragment first to read the current state and version. ' +
        'The update is rejected if this does not match the current version, which means ' +
        'the fragment changed since you read it.',
    ),
  name: z.string().optional().describe('The name of the fragment'),
  description: z.string().optional().describe('Description of the fragment'),
  viewports: z
    .array(z.unknown())
    .optional()
    .describe('Viewport definitions; replaces existing viewports if provided'),
  designProperties: z
    .record(z.unknown())
    .optional()
    .describe('Design property values; replaces existing if provided'),
  contentBindings: z
    .record(z.unknown())
    .optional()
    .describe('Content bindings; replaces existing if provided'),
  slots: z
    .record(z.array(z.unknown()))
    .optional()
    .describe('Slot node definitions; replaces existing if provided'),
  metadata: z
    .object({
      tags: z.array(z.unknown()).optional(),
      concepts: z.array(z.unknown()).optional(),
    })
    .optional()
    .describe('ExO metadata (tags, concepts); replaces existing if provided'),
});

type Params = z.infer<typeof UpdateFragmentToolParams>;

export function updateFragmentTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      fragmentId: args.fragmentId,
    };

    const contentfulClient = createToolClient(config, args);

    // Read before write: fetch current state to preserve fields the caller did not supply.
    const current = await contentfulClient.fragment.get(params);

    // Enforce read-before-write: the caller must supply the version it read.
    if (args.version !== current.sys.version) {
      throw new Error(
        `Version conflict: the fragment has changed since you read it ` +
          `(your version: ${args.version}, current version: ${current.sys.version}). ` +
          `Re-fetch the fragment with get_fragment and retry the update with the latest sys.version.`,
      );
    }

    const fragment = await contentfulClient.fragment.upsert(params, {
      sys: {
        id: current.sys.id,
        type: 'Fragment',
        version: current.sys.version,
      },
      name: args.name ?? current.name,
      description: args.description ?? current.description,
      viewports: args.viewports ?? current.viewports,
      designProperties: args.designProperties ?? current.designProperties,
      ...((args.contentBindings ?? current.contentBindings)
        ? { contentBindings: args.contentBindings ?? current.contentBindings }
        : {}),
      ...((args.slots ?? current.slots)
        ? { slots: args.slots ?? current.slots }
        : {}),
      ...((args.metadata ?? current.metadata)
        ? { metadata: args.metadata ?? current.metadata }
        : {}),
    } as Parameters<typeof contentfulClient.fragment.upsert>[1]);

    return createSuccessResponse('Fragment updated successfully', {
      fragment,
    });
  }

  return withErrorHandling(tool, 'Error updating fragment');
}
