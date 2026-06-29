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

export const UpsertComponentTypeToolParams = BaseToolSchema.extend({
  componentTypeId: z
    .string()
    .describe('The ID of the component type to update'),
  name: z.string().optional().describe('The name of the component type'),
  description: z
    .string()
    .optional()
    .describe('Description of the component type'),
  viewports: z
    .array(z.record(z.unknown()))
    .optional()
    .describe('Viewport definitions; replaces existing viewports if provided'),
  contentProperties: z
    .array(z.record(z.unknown()))
    .optional()
    .describe('Content property definitions; replaces existing if provided'),
  designProperties: z
    .array(z.record(z.unknown()))
    .optional()
    .describe('Design property definitions; replaces existing if provided'),
  componentTree: z
    .array(z.record(z.unknown()))
    .optional()
    .describe('Component tree node definitions; replaces existing if provided'),
  slots: z
    .array(z.record(z.unknown()))
    .optional()
    .describe('Slot definitions; replaces existing if provided'),
  metadata: z
    .record(z.unknown())
    .optional()
    .describe('ExO metadata (tags, concepts); replaces existing if provided'),
});

type Params = z.infer<typeof UpsertComponentTypeToolParams>;

export function upsertComponentTypeTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      componentTypeId: args.componentTypeId,
    };

    const contentfulClient = createToolClient(config, args);

    // Read before write: fetch current state to obtain sys.version and to
    // preserve fields the caller did not supply.
    const current = await contentfulClient.componentType.get(params);

    const componentType = await contentfulClient.componentType.upsert(params, {
      sys: {
        id: current.sys.id,
        type: 'ComponentType',
        version: current.sys.version,
      },
      name: args.name ?? current.name,
      description: args.description ?? current.description,
      viewports: args.viewports ?? current.viewports,
      contentProperties: args.contentProperties ?? current.contentProperties,
      designProperties: args.designProperties ?? current.designProperties,
      ...((args.componentTree ?? current.componentTree)
        ? { componentTree: args.componentTree ?? current.componentTree }
        : {}),
      ...((args.slots ?? current.slots)
        ? { slots: args.slots ?? current.slots }
        : {}),
      ...((args.metadata ?? current.metadata)
        ? { metadata: args.metadata ?? current.metadata }
        : {}),
    } as Parameters<typeof contentfulClient.componentType.upsert>[1]);

    return createSuccessResponse('Component type updated successfully', {
      componentType,
    });
  }

  return withErrorHandling(tool, 'Error updating component type');
}
