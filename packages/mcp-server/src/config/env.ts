import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });

const EnvSchema = z.object({
  CONTENTFUL_MANAGEMENT_ACCESS_TOKEN: z
    .string()
    .describe('Contentful CMA token'),
  CONTENTFUL_HOST: z
    .string()
    .optional()
    .default('api.contentful.com')
    .describe('Contentful API host'),
  APP_ID: z.string().optional().describe('Contentful App ID'),
  SPACE_ID: z.string().optional().describe('Contentful Space ID'),
  ENVIRONMENT_ID: z
    .string()
    .optional()
    .default('master')
    .describe('Contentful environment ID'),
  ORGANIZATION_ID: z.string().optional().describe('Contentful organization ID'),
  CONTENTFUL_DELIVERY_TOKEN: z
    .string()
    .optional()
    .describe(
      'Contentful CDA token (used with export_space to export only published content)',
    ),
  CONTENTFUL_DELIVERY_HOST: z
    .string()
    .optional()
    .describe(
      'Contentful Delivery API host (used with CONTENTFUL_DELIVERY_TOKEN for custom CDA endpoints)',
    ),
});

export const env = EnvSchema.safeParse(process.env);

if (!env.success && process.env['TEST_TYPE'] !== 'unit') {
  console.error('Invalid environment variables', env.error.format());
  process.exit(1);
}
