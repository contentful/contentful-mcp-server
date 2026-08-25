import { createClient, ClientOptions } from 'contentful-management';
import { z } from 'zod';
import type { ContentfulConfig } from '../config/types.js';

export const BaseToolSchema = z.object({
  spaceId: z.string().describe('The ID of the Contentful space'),
  environmentId: z.string().describe('The ID of the Contentful environment'),
});

/**
 * Builds the client-identifying header value for MCP tool calls. ExO calls get a
 * distinguishing `-exo` suffix so Datadog can filter them out from classic CMA
 * calls on the `user-agent` header, which downstream services already capture
 * on their APM spans (unlike this same value on `X-Contentful-User-Agent-Tool`,
 * which today isn't captured anywhere for the ExO-backing services). The version
 * segment is prefixed with `config.mcpSource` (`local` or `remote`) so Datadog can
 * also distinguish traffic from the stdio/local server versus the hosted remote server.
 */
function buildUserAgentToolValue(
  config: ContentfulConfig,
  options?: { exo?: boolean },
): string {
  const source = config.mcpSource ?? 'local';
  return `contentful-mcp${options?.exo ? '-exo' : ''}/${source}-${config.mcpVersion}`;
}

/**
 * Creates a Contentful client configuration from ContentfulConfig
 *
 * @param config - Contentful configuration
 * @param params - Tool parameters that may include a resource
 * @param options - Set `exo: true` for tools operating on ExO entities
 * @returns Configured Contentful client
 */
export function createToolClient(
  config: ContentfulConfig,
  params: z.infer<typeof BaseToolSchema>,
  options?: { exo?: boolean },
) {
  const userAgentTool = buildUserAgentToolValue(config, options);
  const clientConfig: ClientOptions = {
    accessToken: config.accessToken,
    host: config.host ?? 'api.contentful.com',
    space: params.spaceId ?? config.spaceId,
    headers: {
      'X-Contentful-User-Agent-Tool': userAgentTool,
      'User-Agent': userAgentTool,
    },
  };

  return createClient(clientConfig);
}

/**
 * Creates a Contentful client for tools operating on ExO entities (components, experiences,
 * experience templates, experience fragments, data assemblies). Identical to
 * {@link createToolClient}, only with the `-exo` marker on the client-identifying headers.
 */
export function createExoToolClient(
  config: ContentfulConfig,
  params: z.infer<typeof BaseToolSchema>,
) {
  return createToolClient(config, params, { exo: true });
}

/**
 * Creates a Contentful client configuration from ContentfulConfig (for organization-level operations)
 *
 * @param config - Contentful configuration
 * @returns Configured Contentful client options (without space)
 */
export function createClientConfig(config: ContentfulConfig): ClientOptions {
  const userAgentTool = buildUserAgentToolValue(config);
  const clientConfig: ClientOptions = {
    accessToken: config.accessToken,
    host: config.host ?? 'api.contentful.com',
    headers: {
      'X-Contentful-User-Agent-Tool': userAgentTool,
      'User-Agent': userAgentTool,
    },
  };

  return clientConfig;
}

/**
 * Throws if the given environmentId is in the protectedEnvironments list.
 * Call this at the top of any write/delete tool before executing the operation.
 */
export function assertEnvironmentNotProtected(
  environmentId: string,
  protectedEnvironments: string[] | undefined,
): void {
  if (protectedEnvironments && protectedEnvironments.includes(environmentId)) {
    throw new Error(
      `Environment '${environmentId}' is protected. Write and delete operations are not allowed.`,
    );
  }
}
