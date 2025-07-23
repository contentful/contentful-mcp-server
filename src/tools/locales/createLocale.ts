import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const CreateLocaleToolParams = BaseToolSchema.extend({
  name: z.string().describe('The name of the locale'),
  code: z.string().describe('The locale code (e.g., "en-US")'),
  fallbackCode: z
    .string()
    .optional()
    .describe(
      'The locale code to fallback to when there is no content for the current locale',
    ),
  contentDeliveryApi: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'If the content under this locale should be available on the CDA (for public reading)',
    ),
  contentManagementApi: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'If the content under this locale should be available on the CMA (for editing)',
    ),
  default: z
    .boolean()
    .optional()
    .default(false)
    .describe('If this is the default locale'),
  optional: z
    .boolean()
    .optional()
    .default(false)
    .describe('If the locale needs to be filled in on entries or not'),
});

type Params = z.infer<typeof CreateLocaleToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

  // Create the locale
  const newLocale = await contentfulClient.locale.create(params, {
    name: args.name,
    code: args.code,
    fallbackCode: args.fallbackCode,
    contentDeliveryApi: args.contentDeliveryApi,
    contentManagementApi: args.contentManagementApi,
    optional: args.optional,
  });

  return createSuccessResponse('Locale created successfully', { newLocale });
}

export const createLocaleTool = withErrorHandling(
  tool,
  'Error creating locale',
);
