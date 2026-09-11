import { z } from 'zod';
import { BaseToolSchema } from '../../../utils/tools.js';
import {
  AssetQuerySchema,
  EntryQuerySchema,
} from '../../../types/querySchema.js';

/**
 * Contentful's search API supports dynamic filter keys scoped to these
 * prefixes (e.g. `fields.<id>`, `fields.<id>[ne]`, `sys.id`) that can't be
 * statically enumerated since they depend on the customer's content model.
 * Any other unrecognized key is dropped rather than forwarded untouched.
 */
const DYNAMIC_QUERY_KEY_PATTERN = /^(fields|sys|metadata)\./;

function stripUnsupportedQueryKeys(knownKeys: readonly string[]) {
  const knownKeySet = new Set(knownKeys);
  return (value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return value;
    }
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).filter(
        ([key]) => knownKeySet.has(key) || DYNAMIC_QUERY_KEY_PATTERN.test(key),
      ),
    );
  };
}

export const ExportParamsSchema = BaseToolSchema.extend({
  exportDir: z
    .string()
    .optional()
    .describe(
      'Directory to save the exported space data (optional, defaults to current directory)',
    ),
  saveFile: z
    .boolean()
    .optional()
    .default(true)
    .describe('Save the exported space data to a file'),
  contentFile: z
    .string()
    .optional()
    .describe('Custom filename for the exported space data (optional)'),
  includeDrafts: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include draft entries in the export'),
  includeArchived: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include archived entries in the export'),
  skipContentModel: z
    .boolean()
    .optional()
    .default(false)
    .describe('Skip exporting content types'),
  skipEditorInterfaces: z
    .boolean()
    .optional()
    .default(false)
    .describe('Skip exporting editor interfaces'),
  skipContent: z
    .boolean()
    .optional()
    .default(false)
    .describe('Skip exporting entries and assets'),
  skipRoles: z
    .boolean()
    .optional()
    .default(false)
    .describe('Skip exporting roles and permissions'),
  skipTags: z
    .boolean()
    .optional()
    .default(false)
    .describe('Skip exporting tags'),
  skipWebhooks: z
    .boolean()
    .optional()
    .default(false)
    .describe('Skip exporting webhooks'),
  stripTags: z
    .boolean()
    .optional()
    .default(false)
    .describe('Untag assets and entries'),
  contentOnly: z
    .boolean()
    .optional()
    .default(false)
    .describe('Only export assets and entries'),
  queryEntries: EntryQuerySchema.passthrough()
    .transform(stripUnsupportedQueryKeys(Object.keys(EntryQuerySchema.shape)))
    .optional()
    .describe('Export only entries that match query parameters'),
  queryAssets: AssetQuerySchema.passthrough()
    .transform(stripUnsupportedQueryKeys(Object.keys(AssetQuerySchema.shape)))
    .optional()
    .describe('Export only assets that match query parameters'),
  downloadAssets: z
    .boolean()
    .optional()
    .default(false)
    .describe('Download actual asset files'),
  maxAllowedLimit: z
    .number()
    .optional()
    .default(1000)
    .describe('Maximum number of items per request'),
  errorLogFile: z.string().optional().describe('Path to error log output file'),
  useVerboseRenderer: z
    .boolean()
    .optional()
    .describe('Line-by-line logging, useful for CI'),
});

export type ExportParams = z.infer<typeof ExportParamsSchema>;

export const ImportParamsSchema = BaseToolSchema.extend({
  contentFile: z
    .string()
    .optional()
    .describe('Path to JSON file containing the content to import'),
  content: z
    .record(z.any())
    .optional()
    .describe(
      'JS object containing import content (must match expected structure)',
    ),
  contentModelOnly: z
    .boolean()
    .optional()
    .default(false)
    .describe('Import only content types'),
  skipContentModel: z
    .boolean()
    .optional()
    .default(false)
    .describe('Skip importing content types and locales'),
  skipLocales: z
    .boolean()
    .optional()
    .default(false)
    .describe('Skip importing locales'),
  skipContentUpdates: z
    .boolean()
    .optional()
    .default(false)
    .describe('Do not update existing content'),
  skipContentPublishing: z
    .boolean()
    .optional()
    .default(false)
    .describe('Create but do not publish content'),
  uploadAssets: z
    .boolean()
    .optional()
    .default(false)
    .describe('Upload asset files (requires assetsDirectory)'),
  skipAssetUpdates: z
    .boolean()
    .optional()
    .default(false)
    .describe('Do not update existing assets'),
  assetsDirectory: z
    .string()
    .optional()
    .describe('Path to directory containing exported asset files'),
  timeout: z
    .number()
    .optional()
    .default(3000)
    .describe('Time between retries during asset processing (ms)'),
  retryLimit: z
    .number()
    .optional()
    .default(10)
    .describe('Max retries for asset processing'),
  rateLimit: z
    .number()
    .optional()
    .default(7)
    .describe('Max requests per second to the API'),
  errorLogFile: z.string().optional().describe('Path to error log file'),
  useVerboseRenderer: z
    .boolean()
    .optional()
    .describe('Line-by-line progress output (good for CI)'),
});

export type ImportParams = z.infer<typeof ImportParamsSchema>;
