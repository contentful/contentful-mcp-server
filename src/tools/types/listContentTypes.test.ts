import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listContentTypesTool } from './listContentTypes.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockContentTypeGetMany,
  mockContentTypesResponse,
  mockArgs,
} from './mockUtil.js';
import { createToolClient } from '../../utils/tools.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('listContentTypes', () => {
  beforeEach(() => {
    setupMockClient();
  });

  it('should list content types with default parameters', async () => {
    const testArgs = {
      ...mockArgs,
    };

    mockContentTypeGetMany.mockResolvedValue(mockContentTypesResponse);

    const result = await listContentTypesTool(testArgs);

    expect(createToolClient).toHaveBeenCalledWith(testArgs);
    expect(mockContentTypeGetMany).toHaveBeenCalledWith({
      spaceId: testArgs.spaceId,
      environmentId: testArgs.environmentId,
      query: {
        limit: 10,
        skip: 0,
      },
    });

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

    expect(mockContentTypeGetMany).toHaveBeenCalledWith({
      spaceId: testArgs.spaceId,
      environmentId: testArgs.environmentId,
      query: {
        limit: 5,
        skip: 10,
      },
    });

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

    mockContentTypeGetMany.mockResolvedValue(mockContentTypesResponse);

    const result = await listContentTypesTool(testArgs);

    expect(mockContentTypeGetMany).toHaveBeenCalledWith({
      spaceId: testArgs.spaceId,
      environmentId: testArgs.environmentId,
      query: {
        limit: 10, // Capped at maximum
        skip: 0,
      },
    });
  });

  it('should list content types with select parameter', async () => {
    const testArgs = {
      ...mockArgs,
      select: 'sys.id,name,fields',
    };

    mockContentTypeGetMany.mockResolvedValue(mockContentTypesResponse);

    const result = await listContentTypesTool(testArgs);

    expect(mockContentTypeGetMany).toHaveBeenCalledWith({
      spaceId: testArgs.spaceId,
      environmentId: testArgs.environmentId,
      query: {
        limit: 10,
        skip: 0,
        select: 'sys.id,name,fields',
      },
    });
  });

  it('should list content types with include parameter', async () => {
    const testArgs = {
      ...mockArgs,
      include: 2,
    };

    mockContentTypeGetMany.mockResolvedValue(mockContentTypesResponse);

    const result = await listContentTypesTool(testArgs);

    expect(mockContentTypeGetMany).toHaveBeenCalledWith({
      spaceId: testArgs.spaceId,
      environmentId: testArgs.environmentId,
      query: {
        limit: 10,
        skip: 0,
        include: 2,
      },
    });
  });

  it('should list content types with order parameter', async () => {
    const testArgs = {
      ...mockArgs,
      order: 'name',
    };

    mockContentTypeGetMany.mockResolvedValue(mockContentTypesResponse);

    const result = await listContentTypesTool(testArgs);

    expect(mockContentTypeGetMany).toHaveBeenCalledWith({
      spaceId: testArgs.spaceId,
      environmentId: testArgs.environmentId,
      query: {
        limit: 10,
        skip: 0,
        order: 'name',
      },
    });
  });

  it('should list content types with all optional parameters', async () => {
    const testArgs = {
      ...mockArgs,
      limit: 5,
      skip: 5,
      select: 'sys.id,name',
      include: 1,
      order: 'sys.createdAt',
    };

    mockContentTypeGetMany.mockResolvedValue({
      ...mockContentTypesResponse,
      limit: 5,
      skip: 5,
    });

    const result = await listContentTypesTool(testArgs);

    expect(mockContentTypeGetMany).toHaveBeenCalledWith({
      spaceId: testArgs.spaceId,
      environmentId: testArgs.environmentId,
      query: {
        limit: 5,
        skip: 5,
        select: 'sys.id,name',
        include: 1,
        order: 'sys.createdAt',
      },
    });
  });

  it('should handle empty content types list', async () => {
    const testArgs = {
      ...mockArgs,
    };

    const emptyResponse = {
      total: 0,
      skip: 0,
      limit: 10,
      items: [],
    };

    mockContentTypeGetMany.mockResolvedValue(emptyResponse);

    const result = await listContentTypesTool(testArgs);

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
    const testArgs = {
      ...mockArgs,
    };

    const error = new Error('Space not found');
    mockContentTypeGetMany.mockRejectedValue(error);

    const result = await listContentTypesTool(testArgs);

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
