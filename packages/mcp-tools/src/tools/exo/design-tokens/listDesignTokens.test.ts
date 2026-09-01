import { describe, it, expect } from 'vitest';
import {
  mockDesignTokenGetMany,
  mockDesignTokensResponse,
} from './mockClient.js';
import { listDesignTokensTool } from './listDesignTokens.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('listDesignTokens', () => {
  const mockConfig = createMockConfig();
  const baseArgs = {
    spaceId: 'test-space-id',
    environmentId: 'test-environment',
  };

  it('lists design tokens and clamps limit to 10', async () => {
    mockDesignTokenGetMany.mockResolvedValue(mockDesignTokensResponse);

    const tool = listDesignTokensTool(mockConfig);
    const result = await tool({ ...baseArgs, limit: 50 });

    expect(mockDesignTokenGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10 },
    });
    expect(result.content[0].text).toContain(
      'Design tokens retrieved successfully',
    );
  });

  it('forwards cursor and type params', async () => {
    mockDesignTokenGetMany.mockResolvedValue(mockDesignTokensResponse);

    const tool = listDesignTokensTool(mockConfig);
    await tool({ ...baseArgs, pageNext: 'cursor-1', type: 'DTCG.Color' });

    expect(mockDesignTokenGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10, type: 'DTCG.Color', pageNext: 'cursor-1' },
    });
  });

  it('forwards pagePrev cursor param', async () => {
    mockDesignTokenGetMany.mockResolvedValue(mockDesignTokensResponse);

    const tool = listDesignTokensTool(mockConfig);
    await tool({ ...baseArgs, pagePrev: 'cursor-back' });

    expect(mockDesignTokenGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10, pagePrev: 'cursor-back' },
    });
  });

  it('handles errors', async () => {
    mockDesignTokenGetMany.mockRejectedValue(new Error('boom'));

    const tool = listDesignTokensTool(mockConfig);
    const result = await tool(baseArgs);

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error listing design tokens: boom' }],
    });
  });
});
