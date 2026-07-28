import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockExperienceCreate, mockExperience, mockArgs } from './mockClient.js';
import { createExperienceTool } from './createExperience.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

const createArgs = {
  ...mockArgs,
  name: 'Test Experience',
  description: 'A test experience',
  template: {
    sys: {
      type: 'ResourceLink' as const,
      linkType: 'Contentful:Template' as const,
      urn: 'crn:contentful:::content:spaces/test-space-id/environments/test-environment/templates/test-template-id',
    },
  },
  viewports: [],
  designProperties: {},
};

describe('createExperience', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('creates an experience', async () => {
    mockExperienceCreate.mockResolvedValue(mockExperience);

    const tool = createExperienceTool(mockConfig);
    const result = await tool(createArgs);

    expect(mockExperienceCreate).toHaveBeenCalledWith(
      { spaceId: mockArgs.spaceId, environmentId: mockArgs.environmentId },
      expect.objectContaining({ name: createArgs.name }),
    );
    expect(result.content[0].text).toContain('Experience created successfully');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = createExperienceTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool(createArgs);
    expect(mockExperienceCreate).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });
});
