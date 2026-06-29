import { describe, it, expect } from 'vitest';
import {
  mockComponentTypeGetMany,
  mockComponentTypesResponse,
} from './mockClient.js';
import { listComponentTypesTool } from './listComponentTypes.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('listComponentTypes', () => {
  const mockConfig = createMockConfig();
  const baseArgs = {
    spaceId: 'test-space-id',
    environmentId: 'test-environment',
  };

  it('lists component types and clamps limit to 10', async () => {
    mockComponentTypeGetMany.mockResolvedValue(mockComponentTypesResponse);

    const tool = listComponentTypesTool(mockConfig);
    const result = await tool({ ...baseArgs, limit: 50 });

    expect(mockComponentTypeGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10 },
    });
    expect(result.content[0].text).toContain(
      'Component types retrieved successfully',
    );
  });

  it('forwards cursor and order params', async () => {
    mockComponentTypeGetMany.mockResolvedValue(mockComponentTypesResponse);

    const tool = listComponentTypesTool(mockConfig);
    await tool({ ...baseArgs, pageNext: 'cursor-1', order: 'sys.createdAt' });

    expect(mockComponentTypeGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10, pageNext: 'cursor-1', order: 'sys.createdAt' },
    });
  });

  it('forwards pagePrev cursor param', async () => {
    mockComponentTypeGetMany.mockResolvedValue(mockComponentTypesResponse);

    const tool = listComponentTypesTool(mockConfig);
    await tool({ ...baseArgs, pagePrev: 'cursor-back' });

    expect(mockComponentTypeGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10, pagePrev: 'cursor-back' },
    });
  });

  it('handles errors', async () => {
    mockComponentTypeGetMany.mockRejectedValue(new Error('boom'));

    const tool = listComponentTypesTool(mockConfig);
    const result = await tool(baseArgs);

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error listing component types: boom' }],
    });
  });
});
