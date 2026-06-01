import { createHash } from 'node:crypto';

export type DestructiveResource = 'entry' | 'environment' | 'contentType';

export const CONFIRMATION_MESSAGE_PREFIX = 'Confirmation required to delete';

/**
 * Builds a deterministic 16-char hex fingerprint for a delete target.
 * The token changes whenever the underlying resource changes (via sys.version),
 * which means the AI must have actually called the tool once to see the
 * current state before it can produce a token that matches on the second call.
 *
 * For environments, version is omitted (no sys.version on environment).
 */
export function buildConfirmToken(
  resource: DestructiveResource,
  id: string,
  version?: number,
): string {
  const payload = `${resource}:${id}:${version ?? ''}`;
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

export type ConfirmationPreview = {
  preview: Record<string, unknown>;
  confirmToken: string;
  instructions: string;
} & Record<string, unknown>;

const RESOURCE_DISPLAY_NAME: Record<DestructiveResource, string> = {
  entry: 'entry',
  environment: 'environment',
  contentType: 'content type',
};

/**
 * Shape of the response data when a destructive tool is called without a
 * matching confirmToken. The MCP client surfaces this to the LLM/user, who
 * then re-issues the call with `confirm: true` and the supplied token.
 */
export function buildConfirmationPreview(
  resource: DestructiveResource,
  id: string,
  details: Record<string, unknown>,
  confirmToken: string,
): ConfirmationPreview {
  const displayName = RESOURCE_DISPLAY_NAME[resource];
  return {
    preview: details,
    confirmToken,
    instructions:
      `This will permanently delete ${displayName} "${id}". This action cannot be undone. ` +
      `To proceed, call this tool again with confirm: true and confirmToken: "${confirmToken}".`,
  };
}
