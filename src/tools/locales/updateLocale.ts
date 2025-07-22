import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const UpdateLocaleToolParams = BaseToolSchema.extend({
  localeId: z.string().describe('The ID of the locale to update'),
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (existingLocale as any).internal_code;

  // Build update data with only provided fields, merging with existing locale
  const updateData = { ...existingLocale };

  // Only update fields that are explicitly provided (not undefined)
  if (args.name !== undefined) {
    updateData.name = args.name;
  }
  if (args.code !== undefined) {
    updateData.code = args.code;
  }
  if (args.fallbackCode !== undefined) {
    updateData.fallbackCode = args.fallbackCode;
  }
  if (args.contentDeliveryApi !== undefined) {
    updateData.contentDeliveryApi = args.contentDeliveryApi;
  }
  if (args.contentManagementApi !== undefined) {
    updateData.contentManagementApi = args.contentManagementApi;
  }
  if (args.optional !== undefined) {
    updateData.optional = args.optional;
  }

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
