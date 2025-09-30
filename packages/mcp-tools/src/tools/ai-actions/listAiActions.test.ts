import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listAiActionTool } from './listAiActions.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockAiActionGetMany,
  mockAiActionsResponse,
  mockArgs,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('listAiActions', () => {
  beforeEach(() => {
    setupMockClient();
  });

  it('should list AI actions successfully with default parameters', async () => {
    mockAiActionGetMany.mockResolvedValue(mockAiActionsResponse);

    const result = await listAiActionTool(mockArgs);

    const expectedResponse = formatResponse(
      'AI actions retrieved successfully',
      {
        aiActions: {
          ...mockAiActionsResponse,
          items: mockAiActionsResponse.items.map((item) => ({
            id: item.sys.id,
            name: item.name || 'Untitled',
            description: item.description || null,
            instruction: item.instruction || null,
            configuration: item.configuration || null,
            testCases: item.testCases || null,
            createdAt: item.sys.createdAt,
            updatedAt: item.sys.updatedAt,
            publishedVersion: item.sys.publishedVersion,
          })),
        },
        total: 2,
        limit: 3,
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

  it('should enforce maximum limit of 3', async () => {
    const testArgs = {
      ...mockArgs,
      limit: 10, // Should be capped at 3
    };

    mockAiActionGetMany.mockResolvedValue(mockAiActionsResponse);

    await listAiActionTool(testArgs);

    expect(mockAiActionGetMany).toHaveBeenCalledWith({
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      query: {
        limit: 3, // Should be capped
        skip: 0,
      },
    });
  });

  it('should list AI actions with select fields', async () => {
    const testArgs = {
      ...mockArgs,
      select: 'sys.id,name,description',
    };

    mockAiActionGetMany.mockResolvedValue(mockAiActionsResponse);

    await listAiActionTool(testArgs);

    expect(mockAiActionGetMany).toHaveBeenCalledWith({
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      query: {
        limit: 3,
        skip: 0,
        select: 'sys.id,name,description',
      },
    });
  });

  it('should list AI actions with include parameter', async () => {
    const testArgs = {
      ...mockArgs,
      include: 2,
    };

    mockAiActionGetMany.mockResolvedValue(mockAiActionsResponse);

    await listAiActionTool(testArgs);

    expect(mockAiActionGetMany).toHaveBeenCalledWith({
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      query: {
        limit: 3,
        skip: 0,
        include: 2,
      },
    });
  });

  it('should list AI actions with order parameter', async () => {
    const testArgs = {
      ...mockArgs,
      order: 'sys.createdAt',
    };

    mockAiActionGetMany.mockResolvedValue(mockAiActionsResponse);

    await listAiActionTool(testArgs);

    expect(mockAiActionGetMany).toHaveBeenCalledWith({
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      query: {
        limit: 3,
        skip: 0,
        order: 'sys.createdAt',
      },
    });
  });

  it('should handle empty AI actions list', async () => {
    const emptyResponse = {
      total: 0,
      skip: 0,
      limit: 3,
      items: [],
    };

    mockAiActionGetMany.mockResolvedValue(emptyResponse);

    const result = await listAiActionTool(mockArgs);

    const expectedResponse = formatResponse(
      'AI actions retrieved successfully',
      {
        aiActions: {
          ...emptyResponse,
          items: [],
        },
        total: 0,
        limit: 3,
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

  it('should handle errors when listing AI actions fails', async () => {
    const error = new Error('Access denied');
    mockAiActionGetMany.mockRejectedValue(error);

    const result = await listAiActionTool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error listing AI actions: Access denied',
        },
      ],
    });
  });
});
