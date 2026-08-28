import { describe, expect, it } from 'vitest';

import { createSdkError } from '../test-helpers/sdkError.js';
import { createSuccessResponse, withErrorHandling } from './response.js';

const fail = (error: unknown) =>
  withErrorHandling(async () => {
    throw error;
  })({});

describe('withErrorHandling', () => {
  it('leaves successful responses unchanged', async () => {
    const response = createSuccessResponse('Done', { total: 1 });
    expect(await withErrorHandling(async () => response)({})).toBe(response);
  });

  it.each([new Error('Space not found'), 'Space not found'])(
    'preserves ordinary error messages and the tool prefix',
    async (error) => {
      const handler = withErrorHandling(async () => {
        throw error;
      }, 'Error listing content types');
      expect(await handler({})).toEqual({
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Error listing content types: Space not found',
          },
        ],
      });
    },
  );

  it.each([400, 422])('omits SDK request data for HTTP %s', async (status) => {
    const response = await fail(await createSdkError(status));
    expect(response.isError).toBe(true);
    expect(
      JSON.parse(response.content[0].text.slice('Error: '.length)),
    ).toEqual({
      name: status === 400 ? 'BadRequest' : 'ValidationFailed',
      status,
      statusText: 'Bad Request',
      message: 'Validation failed',
      requestId: 'synthetic-request-id',
      details: { errors: [{ name: 'unknown', path: ['fields', 'title'] }] },
    });
  });

  it('filters a serialized SDK error thrown as a string', async () => {
    const response = await fail(
      JSON.stringify({
        status: 401,
        message: 'Access denied',
        request: { headers: { authorization: 'synthetic-secret' } },
      }),
    );
    expect(
      JSON.parse(response.content[0].text.slice('Error: '.length)),
    ).toEqual({
      status: 401,
      message: 'Access denied',
    });
  });

  it.each([
    '{"request":{"headers":{"Authorization":"synthetic-secret"}}',
    '[{"request":{"headers":{"Cookie":"synthetic-secret"}}}]',
    '{"request":{"headers":{"Authorization":"synthetic-secret"}}}',
  ])('does not fall back to raw structured error text', async (message) => {
    expect((await fail(new Error(message))).content[0].text).toBe(
      'Error: Request failed.',
    );
  });
});
