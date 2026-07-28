import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockDataAssemblyGet,
  mockDataAssemblyUnpublish,
  mockDataAssembly,
  mockArgs,
} from './mockClient.js';
import { unpublishDataAssemblyTool } from './unpublishDataAssembly.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('unpublishDataAssembly', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('reads the current version then unpublishes with it', async () => {
    mockDataAssemblyGet.mockResolvedValue(mockDataAssembly);
    mockDataAssemblyUnpublish.mockResolvedValue(mockDataAssembly);

    const tool = unpublishDataAssemblyTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });

    expect(mockDataAssemblyGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      dataAssemblyId: mockArgs.dataAssemblyId,
    });
    expect(mockDataAssemblyUnpublish).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      dataAssemblyId: mockArgs.dataAssemblyId,
      version: mockDataAssembly.sys.version,
    });
    expect(result.content[0].text).toContain('Data assembly unpublished successfully');
  });

  it('rejects a stale version', async () => {
    mockDataAssemblyGet.mockResolvedValue(mockDataAssembly); // sys.version === 1

    const tool = unpublishDataAssemblyTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 999 });

    expect(mockDataAssemblyUnpublish).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Version conflict');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = unpublishDataAssemblyTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool({ ...mockArgs, version: 1 });
    expect(mockDataAssemblyGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockDataAssemblyGet.mockRejectedValue(new Error('boom'));
    const tool = unpublishDataAssemblyTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });
    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error unpublishing data assembly: boom' }],
    });
  });
});
