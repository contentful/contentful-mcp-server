import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockFragmentCreate, mockFragment } from './mockClient.js';
import { createFragmentTool } from './createFragment.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('createFragment', () => {
  const mockConfig = createMockConfig();
  const baseArgs = {
    spaceId: 'test-space-id',
    environmentId: 'test-environment',
    name: 'Test Fragment',
    description: 'A test fragment',
    componentType: {
      sys: {
        type: 'ResourceLink' as const,
        linkType: 'Contentful:ComponentType' as const,
        urn: 'crn:contentful:::content:spaces/test-space-id/component-types/test-component-type-id',
      },
    },
    viewports: [],
    designProperties: {},
  };

  beforeEach(() => vi.clearAllMocks());

  it('creates a fragment successfully', async () => {
    mockFragmentCreate.mockResolvedValue(mockFragment);

    const tool = createFragmentTool(mockConfig);
    const result = await tool(baseArgs);

    expect(mockFragmentCreate).toHaveBeenCalledWith(
      { spaceId: baseArgs.spaceId, environmentId: baseArgs.environmentId },
      expect.objectContaining({
        name: baseArgs.name,
        description: baseArgs.description,
        componentType: baseArgs.componentType,
        viewports: [],
        designProperties: {},
      }),
    );
    expect(result.content[0].text).toContain('Fragment created successfully');
  });

  it('rejects creates in a protected environment', async () => {
    const tool = createFragmentTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool(baseArgs);
    expect(mockFragmentCreate).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockFragmentCreate.mockRejectedValue(new Error('boom'));
    const tool = createFragmentTool(mockConfig);
    const result = await tool(baseArgs);
    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error creating fragment: boom' }],
    });
  });
});
