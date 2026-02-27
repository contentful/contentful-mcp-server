/**
 * Configuration for Contentful MCP Tools
 */
export interface ContentfulConfig {
  /** Contentful CMA (Content Management API) access token */
  accessToken: (() => Promise<string>) | string;
  /** Contentful API host (default: 'api.contentful.com') */
  host?: string;
  /** Contentful Space ID */
  spaceId?: string;
  /** Contentful Environment ID (default: 'master') */
  environmentId?: string;
  /** Contentful Organization ID */
  organizationId?: string;
  /** Contentful App ID */
  appId?: string;
  /** Version number to use for MCP tool calls */
  mcpVersion: string;
}
