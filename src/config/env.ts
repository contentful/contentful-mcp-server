import dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();

const EnvSchema = z.object({
  CONTENTFUL_MANAGEMENT_ACCESS_TOKEN: z
    .string()
    .describe('Contentul CMA token'),
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

  MAX_TOOL_TOKEN_OUTPUT: z.coerce
    .number()
    .optional()
    .default(50000)
    .describe('Maximum tool token output'),
});

export const env = EnvSchema.safeParse(process.env);

if (!env.success) {
  console.error('Invalid environment variables', env.error.format());
  process.exit(1);
}
