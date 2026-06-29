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

export const CreateComponentTypeToolParams = BaseToolSchema.extend({
  name: z.string().describe('The name of the component type'),
  description: z.string().describe('Description of the component type'),
  viewports: z
    .array(z.record(z.unknown()))
    .describe('Viewport definitions for the component type (may be empty)'),
  contentProperties: z
    .array(z.record(z.unknown()))
    .describe('Content property definitions (may be empty)'),
  designProperties: z
    .array(z.record(z.unknown()))
    .describe('Design property definitions (may be empty)'),
  componentTree: z
    .array(z.record(z.unknown()))
    .optional()
    .describe('Optional component tree node definitions'),
  slots: z
    .array(z.record(z.unknown()))
    .optional()
    .describe('Optional slot definitions'),
  metadata: z
    .record(z.unknown())
    .optional()
    .describe('Optional ExO metadata (tags, concepts)'),
});

type Params = z.infer<typeof CreateComponentTypeToolParams>;

export function createComponentTypeTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const contentfulClient = createToolClient(config, args);

    const componentType = await contentfulClient.componentType.create(
      { spaceId: args.spaceId, environmentId: args.environmentId },
      {
        name: args.name,
        description: args.description,
        viewports: args.viewports,
        contentProperties: args.contentProperties,
        designProperties: args.designProperties,
        ...(args.componentTree && { componentTree: args.componentTree }),
        ...(args.slots && { slots: args.slots }),
        ...(args.metadata && { metadata: args.metadata }),
      } as Parameters<typeof contentfulClient.componentType.create>[1],
    );

    return createSuccessResponse('Component type created successfully', {
      componentType,
    });
  }

  return withErrorHandling(tool, 'Error creating component type');
}
