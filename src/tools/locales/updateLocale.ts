import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const UpdateLocaleToolParams = BaseToolSchema.extend({
  localeId: z.string().describe('The ID of the locale to update'),
  fields: z.object({
    name: z.string().optional().describe('The name of the locale'),
    // NOTE: internal_code changes are not allowed
    code: z.string().optional().describe('The code of the locale'),
    fallbackCode: z
      .string()
      .optional()
      .describe(
        'The locale code to fallback to when there is no content for the current locale',
      ),
    contentDeliveryApi: z
      .boolean()
      .optional()
      .describe(
        'If the content under this locale should be available on the CDA (for public reading)',
      ),
    contentManagementApi: z
      .boolean()
      .optional()
      .describe(
        'If the content under this locale should be available on the CMA (for editing)',
      ),
    optional: z
      .boolean()
      .optional()
      .describe('If the locale needs to be filled in on entries or not'),
  }),
});

type Params = z.infer<typeof UpdateLocaleToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
    localeId: args.localeId,
  };

  const contentfulClient = createToolClient(args);

  // First, get the existing locale
  const existingLocale = await contentfulClient.locale.get(params);

  // Remove read-only fields (nternal_code cannot be updated)
  delete (existingLocale as { internal_code?: string }).internal_code;

  // Build update data with only provided fields, merging with existing locale
  const updateData = { ...existingLocale, ...args.fields };

  // Update the locale with merged data
  const updatedLocale = await contentfulClient.locale.update(
    params,
    updateData,
  );

  return createSuccessResponse('Locale updated successfully', {
    updatedLocale,
  });
}

export const updateLocaleTool = withErrorHandling(
  tool,
  'Error updating locale',
);
