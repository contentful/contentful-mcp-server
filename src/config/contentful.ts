import { ClientOptions } from 'contentful-management';
import { env } from '../config/env.js';

/**
 * Creates a default Contentful client configuration without actually initializing it.
 */
export function getDefaultClientConfig(): ClientOptions {
  if (!env.success) {
    throw new Error('Environment variables are not properly configured');
  }

  const clientConfig: ClientOptions = {
    accessToken: env.data.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN,
    host: env.data.CONTENTFUL_HOST,
    space: env.data.SPACE_ID,
  };

  return clientConfig;
}
