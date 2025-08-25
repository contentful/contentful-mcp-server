import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listContentTypesTool } from './listContentTypes.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockContentTypeGetMany,
  mockContentTypesResponse,
  mockArgs,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('listContentTypes', () => {
  beforeEach(() => {
    setupMockClient();
  });

  it('should list content types with default parameters', async () => {
    mockContentTypeGetMany.mockResolvedValue(mockContentTypesResponse);

    const result = await listContentTypesTool(mockArgs);

    const expectedItems = mockContentTypesResponse.items.map((contentType) => ({
      ...contentType,
      id: contentType.sys.id,
      fieldsCount: contentType.fields.length,
    }));

    const expectedResponse = formatResponse(
      'Content types retrieved successfully',
      {
        contentTypes: {
          ...mockContentTypesResponse,
          items: expectedItems,
        },
        total: mockContentTypesResponse.total,
        limit: mockContentTypesResponse.limit,
        skip: mockContentTypesResponse.skip,
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

  it('should list content types with custom limit and skip parameters', async () => {
    const testArgs = {
      ...mockArgs,
      limit: 5,
      skip: 10,
    };

    const customResponse = {
      ...mockContentTypesResponse,
      limit: 5,
      skip: 10,
    };

    mockContentTypeGetMany.mockResolvedValue(customResponse);

    const result = await listContentTypesTool(testArgs);

    const expectedItems = customResponse.items.map((contentType) => ({
      ...contentType,
      id: contentType.sys.id,
      fieldsCount: contentType.fields.length,
    }));

    const expectedResponse = formatResponse(
      'Content types retrieved successfully',
      {
        contentTypes: {
          ...customResponse,
          items: expectedItems,
        },
        total: customResponse.total,
        limit: customResponse.limit,
        skip: customResponse.skip,
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

  it('should enforce maximum limit of 10', async () => {
    const testArgs = {
      ...mockArgs,
      limit: 50, // Will be capped at 10
    };

    await listContentTypesTool(testArgs);

    mockContentTypeGetMany.mockResolvedValue(mockContentTypesResponse);

    expect(mockContentTypeGetMany).toHaveBeenCalledWith({
      spaceId: testArgs.spaceId,
      environmentId: testArgs.environmentId,
      query: {
        limit: 10, // Capped at maximum
        skip: 0,
      },
    });
  });

  it('should handle empty content types list', async () => {
    const emptyResponse = {
      total: 0,
      skip: 0,
      limit: 10,
      items: [],
    };

    mockContentTypeGetMany.mockResolvedValue(emptyResponse);

    const result = await listContentTypesTool(mockArgs);

    const expectedResponse = formatResponse(
      'Content types retrieved successfully',
      {
        contentTypes: emptyResponse,
        total: 0,
        limit: 10,
        skip: 0,
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

  it('should handle errors when listing content types fails', async () => {
    const error = new Error('Space not found');
    mockContentTypeGetMany.mockRejectedValue(error);

    const result = await listContentTypesTool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error listing content types: Space not found',
        },
      ],
    });
  });
});
