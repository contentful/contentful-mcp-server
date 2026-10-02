import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import {
  mockDataAssemblyGet,
  mockDataAssemblyUpdate,
  mockDataAssembly,
  mockArgs,
  mockParameters,
} from './mockClient.js';
import { updateDataAssemblyTool } from './updateDataAssembly.js';
import { createDataAssemblyTools } from './register.js';
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

    const registered = createDataAssemblyTools(mockConfig).updateDataAssembly;
    const args = z.object(registered.inputParams).parse({
      ...mockArgs,
      version: 1,
      name: 'Updated Data Assembly',
    });
    const result = await registered.tool(args);

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
        parameters: mockParameters,
      }),
    );
    expect(result.content[0].text).toContain(
      'Data assembly updated successfully',
    );
  });

  it('forwards a replacement array through the registered input schema', async () => {
    mockDataAssemblyGet.mockResolvedValue(mockDataAssembly);
    mockDataAssemblyUpdate.mockResolvedValue(mockDataAssembly);
    const parameters = [...mockParameters].reverse();
    const registered = createDataAssemblyTools(mockConfig).updateDataAssembly;
    const args = z
      .object(registered.inputParams)
      .parse({ ...mockArgs, version: 1, parameters });

    const result = await registered.tool(args);

    expect(result.isError).not.toBe(true);
    expect(mockDataAssemblyUpdate).toHaveBeenCalledWith(
      mockArgs,
      expect.objectContaining({ parameters }),
    );
  });

  it('accepts an empty replacement array instead of retaining current parameters', async () => {
    mockDataAssemblyGet.mockResolvedValue(mockDataAssembly);
    mockDataAssemblyUpdate.mockResolvedValue(mockDataAssembly);
    const registered = createDataAssemblyTools(mockConfig).updateDataAssembly;
    const args = z
      .object(registered.inputParams)
      .parse({ ...mockArgs, version: 1, parameters: [] });

    await registered.tool(args);

    expect(mockDataAssemblyUpdate).toHaveBeenCalledWith(
      mockArgs,
      expect.objectContaining({ parameters: [] }),
    );
  });

  it('rejects legacy record input through the registered schema', () => {
    const registered = createDataAssemblyTools(mockConfig).updateDataAssembly;
    expect(() =>
      z.object(registered.inputParams).parse({
        ...mockArgs,
        version: 1,
        parameters: { title: { type: 'String', required: true } },
      }),
    ).toThrow();
    expect(mockDataAssemblyUpdate).not.toHaveBeenCalled();
  });

  it('rejects a noncanonical current response rather than resubmitting a record', async () => {
    mockDataAssemblyGet.mockResolvedValue({
      ...mockDataAssembly,
      parameters: {},
    });
    const tool = updateDataAssemblyTool(mockConfig);

    const result = await tool({ ...mockArgs, version: 1, name: 'New name' });

    expect(result.isError).toBe(true);
    expect(mockDataAssemblyUpdate).not.toHaveBeenCalled();
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
