import type {
  ServerNotification,
  ServerRequest,
} from '@modelcontextprotocol/sdk/types.js';

import { formatResponse } from './formatters.js';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';

/**
 * Response type for tool handlers
 */
export type ToolResponse = {
  isError?: boolean;
  content: Array<{
    type: 'text';
    text: string;
  }>;
};

/**
 * Creates a standardized success response
 */
export function createSuccessResponse(
  message: string,
  data?: Record<string, unknown>,
): ToolResponse {
  const text = data ? formatResponse(message, data) : message;

  return {
    content: [
      {
        type: 'text',
        text,
      },
    ],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The CMA SDK serializes request headers and payloads into Error.message,
 * including partially masked tokens. Only return diagnostic fields from that
 * envelope; never forward the request, even when the SDK has masked it.
 */
function formatErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (!/^\s*[[{]/.test(message)) return message;

  let data: unknown;
  try {
    data = JSON.parse(message);
  } catch {
    // A malformed or truncated envelope can still contain credentials.
    return 'Request failed.';
  }
  if (!isRecord(data)) return 'Request failed.';

  const diagnostics: Record<string, unknown> = {};
  if (
    error instanceof Error &&
    error.name !== 'Error' &&
    /^[A-Za-z]\w*$/.test(error.name)
  ) {
    diagnostics['name'] = error.name;
  }
  if (
    typeof data['status'] === 'number' &&
    Number.isInteger(data['status']) &&
    data['status'] >= 100 &&
    data['status'] <= 599
  ) {
    diagnostics['status'] = data['status'];
  }
  for (const key of ['statusText', 'message', 'requestId']) {
    if (typeof data[key] === 'string' && !/^\s*[[{]/.test(data[key])) {
      diagnostics[key] = data[key];
    }
  }
  if (isRecord(data['details']) && Array.isArray(data['details']['errors'])) {
    const errors = data['details']['errors']
      .filter(isRecord)
      .map((item) => {
        const diagnostic: Record<string, unknown> = {};
        if (typeof item['name'] === 'string') diagnostic['name'] = item['name'];
        if (
          Array.isArray(item['path']) &&
          item['path'].every(
            (part) => typeof part === 'string' || typeof part === 'number',
          )
        ) {
          diagnostic['path'] = item['path'];
        }
        return diagnostic;
      })
      .filter((item) => Object.keys(item).length > 0);
    if (errors.length > 0) diagnostics['details'] = { errors };
  }

  return Object.keys(diagnostics).length > 0
    ? JSON.stringify(diagnostics, null, '  ')
    : 'Request failed.';
}

/**
 * Higher-order function that wraps tool handlers with standardized error handling
 */
export function withErrorHandling<T extends Record<string, unknown>>(
  handler: (
    params: T,
    extra?: RequestHandlerExtra<ServerRequest, ServerNotification>,
  ) => Promise<ToolResponse>,
  errorPrefix = 'Error',
): (
  params: T,
  extra?: RequestHandlerExtra<ServerRequest, ServerNotification>,
) => Promise<ToolResponse> {
  return async (
    params: T,
    extra?: RequestHandlerExtra<ServerRequest, ServerNotification>,
  ) => {
    try {
      return await handler(params, extra);
    } catch (error: unknown) {
      const errorMessage = formatErrorMessage(error);
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `${errorPrefix}: ${errorMessage}`,
          },
        ],
      };
    }
  };
}
