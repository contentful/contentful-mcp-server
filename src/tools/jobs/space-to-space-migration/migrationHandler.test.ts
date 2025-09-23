import { describe, it, expect, beforeEach, vi } from 'vitest';
import { makeSpaceToSpaceMigrationHandlerTool } from './migrationHandler.js';
import { mockMigrationHandlerArgs } from './mockClient.js';
import type { RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('migrationHandler', () => {
  let mockTool1: RegisteredTool;
  let mockTool2: RegisteredTool;
  let mockTool3: RegisteredTool;
  let tools: RegisteredTool[];
  let migrationHandlerTool: ReturnType<
    typeof makeSpaceToSpaceMigrationHandlerTool
  >;

  beforeEach(() => {
    // Create mock tools with enable/disable methods
    mockTool1 = {
      enable: vi.fn(),
      disable: vi.fn(),
      callback: vi.fn(),
      enabled: true,
      update: vi.fn(),
      remove: vi.fn(),
    } as RegisteredTool;
    mockTool2 = {
      enable: vi.fn(),
      disable: vi.fn(),
      callback: vi.fn(),
      enabled: true,
      update: vi.fn(),
      remove: vi.fn(),
    } as RegisteredTool;
    mockTool3 = {
      enable: vi.fn(),
      disable: vi.fn(),
      callback: vi.fn(),
      enabled: true,
      update: vi.fn(),
      remove: vi.fn(),
    } as RegisteredTool;

    tools = [mockTool1, mockTool2, mockTool3];
    migrationHandlerTool = makeSpaceToSpaceMigrationHandlerTool(tools);

    vi.clearAllMocks();
  });

  it('should enable workflow when enableWorkflow is true', async () => {
    const testArgs = {
      ...mockMigrationHandlerArgs,
      enableWorkflow: true,
    };

    const result = await migrationHandlerTool(testArgs);

    // Verify all tools were enabled
    expect(mockTool1.enable).toHaveBeenCalledTimes(1);
    expect(mockTool2.enable).toHaveBeenCalledTimes(1);
    expect(mockTool3.enable).toHaveBeenCalledTimes(1);

    // Verify disable was not called
    expect(mockTool1.disable).not.toHaveBeenCalled();
    expect(mockTool2.disable).not.toHaveBeenCalled();
    expect(mockTool3.disable).not.toHaveBeenCalled();

    expect(result.content[0].text).toContain(
      'Space to space migration workflow started',
    );
    expect(result.content[0].text).toContain(
      '<enableWorkflow>true</enableWorkflow>',
    );
    expect(result.content[0].text).toContain(
      'You are a helpful assistant that can help with space to space migration',
    );
  });

  it('should disable workflow when enableWorkflow is false', async () => {
    const testArgs = {
      ...mockMigrationHandlerArgs,
      enableWorkflow: false,
    };

    const result = await migrationHandlerTool(testArgs);

    // Verify all tools were disabled
    expect(mockTool1.disable).toHaveBeenCalledTimes(1);
    expect(mockTool2.disable).toHaveBeenCalledTimes(1);
    expect(mockTool3.disable).toHaveBeenCalledTimes(1);

    // Verify enable was not called
    expect(mockTool1.enable).not.toHaveBeenCalled();
    expect(mockTool2.enable).not.toHaveBeenCalled();
    expect(mockTool3.enable).not.toHaveBeenCalled();

    expect(result.content[0].text).toContain(
      'Space to space migration workflow concluded',
    );
    expect(result.content[0].text).toContain(
      'The space to space migration workflow has been concluded',
    );
  });
});
