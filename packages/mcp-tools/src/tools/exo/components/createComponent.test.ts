import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockComponentCreate,
  mockComponentUpsert,
  mockComponent,
} from './mockClient.js';
import {
  createComponentTool,
  CreateComponentToolParams,
} from './createComponent.js';
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
    componentTree: [],
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
        contentProperties: [],
        designProperties: [],
        componentTree: [],
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

  it('creates a component with a custom ID using upsert', async () => {
    const testArgs = { ...args, componentId: 'custom-component-id' };
    const mockComponentWithId = {
      ...mockComponent,
      sys: { ...mockComponent.sys, id: testArgs.componentId },
    };
    mockComponentUpsert.mockResolvedValue(mockComponentWithId);

    const tool = createComponentTool(mockConfig);
    const result = await tool(testArgs);

    expect(mockComponentUpsert).toHaveBeenCalledWith(
      {
        spaceId: args.spaceId,
        environmentId: args.environmentId,
        componentId: testArgs.componentId,
      },
      {
        sys: { id: testArgs.componentId, type: 'Component' },
        name: 'Hero',
        description: 'A hero section',
        contentProperties: [],
        designProperties: [],
        componentTree: [],
      },
    );
    expect(mockComponentCreate).not.toHaveBeenCalled();
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: formatResponse('Component created successfully', {
            component: mockComponentWithId,
          }),
        },
      ],
    });
  });

  it('omits supplied viewport definitions when creating a component', async () => {
    mockComponentCreate.mockResolvedValue(mockComponent);

    await createComponentTool(mockConfig)(args);

    expect(mockComponentCreate.mock.calls[0][1]).not.toHaveProperty(
      'viewports',
    );
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

  it('defaults componentTree to an empty array when omitted', () => {
    const parsed = CreateComponentToolParams.parse({
      spaceId: 's',
      environmentId: 'e',
      name: 'n',
      description: 'd',
      contentProperties: [],
      designProperties: [],
    });

    expect(parsed.componentTree).toEqual([]);
  });
});
