import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const ResolveEntryReferencesToolParams = BaseToolSchema.extend({
  entryId: z
    .string()
    .describe('The ID of the entry whose references should be resolved'),
  include: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .default(2)
    .describe(
      'How many levels of linked entries to walk (1-10, default: 2). The CMA caps this at 10.',
    ),
});

// z.input (not z.infer) so the optional-with-default `include` stays optional
// in the handler signature; the MCP runtime applies the default via the schema.
type Params = z.input<typeof ResolveEntryReferencesToolParams>;

export function resolveEntryReferencesTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const { include = 2 } = args;

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      entryId: args.entryId,
      include,
    };

    const contentfulClient = createToolClient(config, args);

    const references = await contentfulClient.entry.references(params);

    return createSuccessResponse('Entry references retrieved successfully', {
      references,
    });
  }

  return withErrorHandling(tool, 'Error resolving entry references');
}
