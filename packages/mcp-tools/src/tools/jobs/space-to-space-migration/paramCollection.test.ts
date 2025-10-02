import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createParamCollectionTool } from './paramCollection.js';
import { formatResponse } from '../../../utils/formatters.js';
import { mockParamCollectionArgs, mockArgs } from './mockClient.js';

describe('paramCollection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return parameter collection instructions when confirmation is false', async () => {
    const testArgs = {
      ...mockParamCollectionArgs,
      confirmation: false,
    };

    const result = await createParamCollectionTool(testArgs);

    expect(result.content[0].text).toContain('Param collection tool');
    expect(result.content[0].text).toContain(
      'Help the user collect the correct parameters',
    );
    expect(result.content[0].text).toContain('availableParams');
    expect(result.content[0].text).toContain('currentParams');
  });

  it('should return parameter collection instructions when confirmation is undefined', async () => {
    const testArgs = {
      ...mockParamCollectionArgs,
      confirmation: undefined,
    };

    const result = await createParamCollectionTool(testArgs);

    expect(result.content[0].text).toContain('Param collection tool');
    expect(result.content[0].text).toContain('instructions');
  });

  it('should return ready-to-proceed response when confirmation is true', async () => {
    const testArgs = {
      ...mockParamCollectionArgs,
      confirmation: true,
    };

    const result = await createParamCollectionTool(testArgs);

    const expectedResponse = formatResponse(
      'User ready to proceed with workflow',
      {
        message:
          'User has confirmed they are ready to proceed with the space-to-space migration workflow.',
        workflowParams: {
          export: {
            spaceId: 'source-space-id',
            environmentId: 'master',
            exportDir: '/test/export',
            contentFile: 'export.json',
          },
          import: {
            spaceId: 'target-space-id',
            environmentId: 'master',
            contentFile: '/test/export/export.json',
          },
        },
        nextStep:
          'Proceed with the migration workflow using the collected parameters.',
      },
    );

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });
  });

  it('should handle empty export and import parameters', async () => {
    const testArgs = {
      ...mockArgs,
      confirmation: false,
      export: {},
      import: {},
    };

    const result = await createParamCollectionTool(testArgs);

    expect(result.content[0].text).toContain('currentParams');
    expect(result.content[0].text).toContain('<currentParams/>');
  });

  it('should handle missing export and import parameters', async () => {
    const testArgs = {
      ...mockArgs,
      confirmation: false,
    };

    const result = await createParamCollectionTool(testArgs);

    expect(result.content[0].text).toContain('currentParams');
    expect(result.content[0].text).toContain('<currentParams/>');
  });

  it('should handle complex export parameters', async () => {
    const testArgs = {
      ...mockArgs,
      confirmation: false,
      export: {
        spaceId: 'source-space',
        environmentId: 'staging',
        exportDir: '/exports',
        contentFile: 'backup.json',
        includeDrafts: true,
        includeArchived: false,
        skipContentModel: true,
        skipContent: false,
        downloadAssets: true,
        queryEntries: {
          content_type: 'blogPost',
          'fields.published': true,
        },
        queryAssets: {
          mimetype_group: 'image',
          limit: 50,
        },
        host: 'custom.contentful.com',
        proxy: 'http://proxy:8080',
        headers: {
          'X-Custom-Header': 'value',
        },
        maxAllowedLimit: 500,
        useVerboseRenderer: true,
        errorLogFile: '/logs/export-errors.log',
      },
    };

    const result = await createParamCollectionTool(testArgs);

    const responseText = result.content[0].text;
    expect(responseText).toContain('<spaceId>source-space</spaceId>');
    expect(responseText).toContain('<environmentId>staging</environmentId>');
    expect(responseText).toContain('<includeDrafts>true</includeDrafts>');
    expect(responseText).toContain('<skipContentModel>true</skipContentModel>');
    expect(responseText).toContain('<downloadAssets>true</downloadAssets>');
    expect(responseText).toContain('<maxAllowedLimit>500</maxAllowedLimit>');
    expect(responseText).toContain(
      '<useVerboseRenderer>true</useVerboseRenderer>',
    );
  });

  it('should handle complex import parameters', async () => {
    const testArgs = {
      ...mockArgs,
      confirmation: false,
      import: {
        spaceId: 'target-space',
        environmentId: 'production',
        contentFile: '/imports/data.json',
        contentModelOnly: true,
        skipContentModel: false,
        skipLocales: true,
        skipContentUpdates: false,
        skipContentPublishing: true,
        uploadAssets: true,
        skipAssetUpdates: false,
        assetsDirectory: '/assets',
        timeout: 5000,
        retryLimit: 15,
        host: 'eu.contentful.com',
        proxy: 'user:pass@proxy:8080',
        rawProxy: true,
        rateLimit: 10,
        headers: {
          Authorization: 'Bearer token',
        },
        errorLogFile: '/logs/import-errors.log',
        useVerboseRenderer: false,
        config: '/config/import.json',
      },
    };

    const result = await createParamCollectionTool(testArgs);

    const responseText = result.content[0].text;
    expect(responseText).toContain('<spaceId>target-space</spaceId>');
    expect(responseText).toContain('<environmentId>production</environmentId>');
    expect(responseText).toContain('<contentModelOnly>true</contentModelOnly>');
    expect(responseText).toContain('<skipLocales>true</skipLocales>');
    expect(responseText).toContain('<uploadAssets>true</uploadAssets>');
    expect(responseText).toContain('<timeout>5000</timeout>');
    expect(responseText).toContain('<retryLimit>15</retryLimit>');
    expect(responseText).toContain('<rateLimit>10</rateLimit>');
  });

  it('should handle query parameters for entries and assets', async () => {
    const testArgs = {
      ...mockArgs,
      confirmation: false,
      export: {
        spaceId: 'test-space',
        queryEntries: {
          content_type: 'article',
          'fields.status': 'published',
          limit: 100,
        },
        queryAssets: {
          mimetype_group: 'image',
          order: 'sys.createdAt',
        },
      },
    };

    const result = await createParamCollectionTool(testArgs);

    const responseText = result.content[0].text;
    expect(responseText).toContain('queryEntries');
    expect(responseText).toContain('queryAssets');
    expect(responseText).toContain('<content_type>article</content_type>');
    expect(responseText).toContain('<fields.status>published</fields.status>');
    expect(responseText).toContain('<mimetype_group>image</mimetype_group>');
  });
});
