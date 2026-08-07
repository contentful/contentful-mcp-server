import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockComponentCreate, mockComponent } from './mockClient.js';
import { createComponentTool } from './createComponent.js';
import { formatResponse } from '../../../utils/formatters.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('createComponent', () => {
  const mockConfig = createMockConfig();
  const args = {
    spaceId: 'test-space-id',
    environmentId: 'test-environment',
    name: 'Hero',
    description: 'A hero section',
    viewports: [],
    contentProperties: [],
    designProperties: [],
  };

  beforeEach(() => vi.clearAllMocks());

  it('creates a component successfully', async () => {
    mockComponentCreate.mockResolvedValue(mockComponent);

    const tool = createComponentTool(mockConfig);
    const result = await tool(args);

    expect(mockComponentCreate).toHaveBeenCalledWith(
      { spaceId: args.spaceId, environmentId: args.environmentId },
      {
        name: 'Hero',
        description: 'A hero section',
        viewports: [],
        contentProperties: [],
        designProperties: [],
      },
    );
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: formatResponse('Component created successfully', {
            component: mockComponent,
          }),
        },
      ],
    });
  });

  it('rejects writes to a protected environment', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['test-environment'],
    });

    const tool = createComponentTool(protectedConfig);
    const result = await tool(args);

    expect(mockComponentCreate).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });
});
