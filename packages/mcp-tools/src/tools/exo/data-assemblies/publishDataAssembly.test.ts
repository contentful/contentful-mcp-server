import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockDataAssemblyGet,
  mockDataAssemblyPublish,
  mockDataAssembly,
  mockArgs,
} from './mockClient.js';
import { publishDataAssemblyTool } from './publishDataAssembly.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('publishDataAssembly', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('reads the current version then publishes with it', async () => {
    mockDataAssemblyGet.mockResolvedValue(mockDataAssembly);
    mockDataAssemblyPublish.mockResolvedValue(mockDataAssembly);

    const tool = publishDataAssemblyTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });

    expect(mockDataAssemblyGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      dataAssemblyId: mockArgs.dataAssemblyId,
    });
    expect(mockDataAssemblyPublish).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      dataAssemblyId: mockArgs.dataAssemblyId,
      version: mockDataAssembly.sys.version,
    });
    expect(result.content[0].text).toContain('Data assembly published successfully');
  });

  it('rejects a stale version', async () => {
    mockDataAssemblyGet.mockResolvedValue(mockDataAssembly); // sys.version === 1

    const tool = publishDataAssemblyTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 999 });

    expect(mockDataAssemblyPublish).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Version conflict');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = publishDataAssemblyTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool({ ...mockArgs, version: 1 });
    expect(mockDataAssemblyGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockDataAssemblyGet.mockRejectedValue(new Error('boom'));
    const tool = publishDataAssemblyTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });
    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error publishing data assembly: boom' }],
    });
  });
});
