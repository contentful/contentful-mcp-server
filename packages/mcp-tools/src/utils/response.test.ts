import * as contentful from 'contentful-management';
import { describe, expect, it } from 'vitest';

import { createSuccessResponse, withErrorHandling } from './response.js';

describe('withErrorHandling', () => {
  it('leaves successful responses unchanged', async () => {
    const response = createSuccessResponse('Done', { total: 1 });
    const handler = withErrorHandling(async () => response);

    expect(await handler({})).toBe(response);
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

  it.each([
    {
      status: 422,
      name: 'ValidationFailed',
      message: 'No field with id "internalName" found.',
    },
    {
      status: 400,
      name: 'BadRequest',
      message: 'Select is only applicable for Entries and Assets.',
    },
  ])('omits SDK request data for HTTP $status', async (failure) => {
    const client = contentful.createClient(
      {
        accessToken: 'synthetic-token-ABCDE',
        host: 'contentful.invalid',
        retryOnError: false,
        headers: {
          Cookie: 'synthetic-cookie',
          'Proxy-Authorization': 'synthetic-proxy-credential',
          'X-Contentful-Resource-Resolution': 'synthetic-resolution-UVWXY',
          'X-Custom-Secret': 'synthetic-custom-secret',
        },
        adapter: async (config) => {
          throw {
            config: { ...config, data: 'synthetic-request-payload' },
            response: {
              status: failure.status,
              statusText: 'Bad Request',
              data: {
                sys: { id: failure.name, type: 'Error' },
                message: failure.message,
                requestId: 'synthetic-request-id',
                details: {
                  errors: [
                    {
                      name: 'unknown',
                      path: ['fields', 'internalName'],
                      value: 'synthetic-invalid-field-value',
                    },
                  ],
                  request: {
                    headers: { Authorization: 'synthetic-nested-secret' },
                  },
                },
              },
            },
          };
        },
      },
      { type: 'plain' },
    );
    const handler = withErrorHandling(async () => {
      await client.contentType.getMany({
        spaceId: 'test-space',
        environmentId: 'test-environment',
      });
      return createSuccessResponse('Unexpected success');
    }, 'Error listing content types');

    const response = await handler({});

    expect(response.isError).toBe(true);
    expect(response.content).toHaveLength(1);
    const text = response.content[0].text;
    expect(text).toMatch(/^Error listing content types: /);
    expect(
      JSON.parse(text.replace(/^Error listing content types: /, '')),
    ).toEqual({
      name: failure.name,
      status: failure.status,
      statusText: 'Bad Request',
      message: failure.message,
      requestId: 'synthetic-request-id',
      details: {
        errors: [{ name: 'unknown', path: ['fields', 'internalName'] }],
      },
    });
    expect(text).not.toMatch(
      /synthetic-(?:token|cookie|proxy|resolution|custom|request-payload|invalid|nested)|ABCDE|UVWXY|headers|payloadData/,
    );
  });

  it('filters a serialized SDK error thrown as a string', async () => {
    const handler = withErrorHandling(async () => {
      throw JSON.stringify({
        status: 401,
        message: 'Access denied',
        request: { headers: { authorization: 'synthetic-secret' } },
      });
    });

    const response = await handler({});

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
    const handler = withErrorHandling(async () => {
      throw new Error(message);
    });

    expect(await handler({})).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error: Request failed.' }],
    });
  });
});
