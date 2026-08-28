import * as contentful from 'contentful-management';

/** Build an actual SDK error without network access or real credentials. */
export async function createSdkError(status = 422): Promise<Error> {
  const client = contentful.createClient({
    accessToken: 'synthetic-token-ABCDE',
    host: 'contentful.invalid',
    retryOnError: false,
    headers: { 'X-Custom-Secret': 'synthetic-secret' },
    adapter: async (config) => {
      throw {
        config: { ...config, data: 'synthetic-secret' },
        response: {
          status,
          statusText: 'Bad Request',
          data: {
            sys: { id: status === 400 ? 'BadRequest' : 'ValidationFailed' },
            message: 'Validation failed',
            requestId: 'synthetic-request-id',
            details: {
              errors: [
                {
                  name: 'unknown',
                  path: ['fields', 'title'],
                  value: 'synthetic-secret',
                },
              ],
              request: { headers: { Authorization: 'synthetic-secret' } },
            },
          },
        },
      };
    },
  });

  return client.contentType
    .getMany({ spaceId: 'test-space', environmentId: 'test-environment' })
    .then(
      () => {
        throw new Error('Expected the SDK request to fail');
      },
      (error: Error) => error,
    );
}
