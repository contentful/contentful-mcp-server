import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockExperienceFragmentCreate,
  mockExperienceFragment,
} from './mockClient.js';
import { createExperienceFragmentTool } from './createExperienceFragment.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('createExperienceFragment', () => {
  const mockConfig = createMockConfig();
  const baseArgs = {
    spaceId: 'test-space-id',
    environmentId: 'test-environment',
    name: 'Test Experience Fragment',
    description: 'A test experience fragment',
    component: {
      sys: {
        type: 'ResourceLink' as const,
        linkType: 'Contentful:Component' as const,
        urn: 'crn:contentful:::experience:spaces/test-space-id/environments/test-environment/components/test-component-id',
      },
    },
    viewports: [],
    designProperties: {},
  };

  beforeEach(() => vi.clearAllMocks());

  it('creates an experience fragment successfully', async () => {
    mockExperienceFragmentCreate.mockResolvedValue(mockExperienceFragment);

    const tool = createExperienceFragmentTool(mockConfig);
    const result = await tool(baseArgs);

    expect(mockExperienceFragmentCreate).toHaveBeenCalledWith(
      { spaceId: baseArgs.spaceId, environmentId: baseArgs.environmentId },
      expect.objectContaining({
        name: baseArgs.name,
        description: baseArgs.description,
        component: baseArgs.component,
        viewports: [],
        designProperties: {},
      }),
    );
    expect(result.content[0].text).toContain(
      'Experience fragment created successfully',
    );
  });

  it('rejects creates in a protected environment', async () => {
    const tool = createExperienceFragmentTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool(baseArgs);
    expect(mockExperienceFragmentCreate).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockExperienceFragmentCreate.mockRejectedValue(new Error('boom'));
    const tool = createExperienceFragmentTool(mockConfig);
    const result = await tool(baseArgs);
    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error creating experience fragment: boom' },
      ],
    });
  });
});
