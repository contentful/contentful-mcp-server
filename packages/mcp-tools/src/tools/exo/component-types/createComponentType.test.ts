import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockComponentTypeCreate,
  mockComponentType,
} from './mockClient.js';
import { createComponentTypeTool } from './createComponentType.js';
import { formatResponse } from '../../../utils/formatters.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('createComponentType', () => {
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

  it('creates a component type successfully', async () => {
    mockComponentTypeCreate.mockResolvedValue(mockComponentType);

    const tool = createComponentTypeTool(mockConfig);
    const result = await tool(args);

    expect(mockComponentTypeCreate).toHaveBeenCalledWith(
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
          text: formatResponse('Component type created successfully', {
            componentType: mockComponentType,
          }),
        },
      ],
    });
  });

  it('rejects writes to a protected environment', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['test-environment'],
    });

    const tool = createComponentTypeTool(protectedConfig);
    const result = await tool(args);

    expect(mockComponentTypeCreate).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });
});
