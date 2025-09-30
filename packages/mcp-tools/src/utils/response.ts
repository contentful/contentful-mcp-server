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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
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
