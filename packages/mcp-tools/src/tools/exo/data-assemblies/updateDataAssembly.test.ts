import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockDataAssemblyGet,
  mockDataAssemblyUpdate,
  mockDataAssembly,
  mockArgs,
} from './mockClient.js';
import { updateDataAssemblyTool } from './updateDataAssembly.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('updateDataAssembly', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('reads before writing and merges fields', async () => {
    mockDataAssemblyGet.mockResolvedValue(mockDataAssembly);
    mockDataAssemblyUpdate.mockResolvedValue({
      ...mockDataAssembly,
      name: 'Updated Data Assembly',
      sys: { ...mockDataAssembly.sys, version: 2 },
    });

    const tool = updateDataAssemblyTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      version: 1,
      name: 'Updated Data Assembly',
    });

    expect(mockDataAssemblyGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      dataAssemblyId: mockArgs.dataAssemblyId,
    });
    expect(mockDataAssemblyUpdate).toHaveBeenCalledWith(
      {
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
        dataAssemblyId: mockArgs.dataAssemblyId,
      },
      expect.objectContaining({
        name: 'Updated Data Assembly',
        description: mockDataAssembly.description,
      }),
    );
    expect(result.content[0].text).toContain(
      'Data assembly updated successfully',
    );
  });

  it('forwards an ordered parameter update without changing its order or metadata', async () => {
    mockDataAssemblyGet.mockResolvedValue(mockDataAssembly);
    mockDataAssemblyUpdate.mockResolvedValue(mockDataAssembly);
    const parameters = [
      {
        id: 'second',
        type: 'ResourceLink' as const,
        linkType: 'Contentful:Entry' as const,
        required: false,
        allowedResources: [
          {
            type: 'Contentful:Entry' as const,
            source:
              'crn:contentful:::content:spaces/$self/environments/$self' as const,
            allowedTypes: ['blogPost'],
          },
        ],
      },
      {
        id: 'first',
        type: 'ResourceLink' as const,
        linkType: 'Contentful:Entry' as const,
        required: true,
        allowedResources: [
          {
            type: 'Contentful:Entry' as const,
            source:
              'crn:contentful:::content:spaces/$self/environments/$self' as const,
            allowedTypes: ['author'],
          },
        ],
      },
    ];

    const tool = updateDataAssemblyTool(mockConfig);
    await tool({ ...mockArgs, version: 1, parameters });

    expect(mockDataAssemblyUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ parameters }),
    );
  });

  it('retains an ordered parameter array read from the API when updating another field', async () => {
    const parameters = [
      {
        id: 'post',
        type: 'ResourceLink' as const,
        linkType: 'Contentful:Entry' as const,
        required: false,
        allowedResources: [
          {
            type: 'Contentful:Entry' as const,
            source:
              'crn:contentful:::content:spaces/$self/environments/$self' as const,
            allowedTypes: ['blogPost'],
          },
        ],
      },
    ];
    mockDataAssemblyGet.mockResolvedValue({ ...mockDataAssembly, parameters });
    mockDataAssemblyUpdate.mockResolvedValue(mockDataAssembly);

    const tool = updateDataAssemblyTool(mockConfig);
    await tool({ ...mockArgs, version: 1, name: 'Updated Data Assembly' });

    expect(mockDataAssemblyUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ parameters }),
    );
  });

  it('rejects a stale version', async () => {
    mockDataAssemblyGet.mockResolvedValue(mockDataAssembly); // sys.version === 1

    const tool = updateDataAssemblyTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 999 });

    expect(mockDataAssemblyUpdate).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Version conflict');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = updateDataAssemblyTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool({ ...mockArgs, version: 1 });
    expect(mockDataAssemblyGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockDataAssemblyGet.mockRejectedValue(new Error('boom'));
    const tool = updateDataAssemblyTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });
    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error updating data assembly: boom' }],
    });
  });
});
