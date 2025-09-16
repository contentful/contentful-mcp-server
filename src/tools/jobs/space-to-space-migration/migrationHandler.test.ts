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

  it('should handle empty tools array', async () => {
    const emptyToolsHandler = makeSpaceToSpaceMigrationHandlerTool([]);

    const testArgs = {
      ...mockMigrationHandlerArgs,
      enableWorkflow: true,
    };

    const result = await emptyToolsHandler(testArgs);

    expect(result.content[0].text).toContain(
      'Space to space migration workflow started',
    );
    expect(result.content[0].text).toContain(
      '<enableWorkflow>true</enableWorkflow>',
    );
  });

  it('should handle tools with null/undefined values', async () => {
    const toolsWithNulls = [
      mockTool1,
      null,
      mockTool2,
      undefined,
      mockTool3,
    ].filter(Boolean) as RegisteredTool[];
    const handlerWithNulls =
      makeSpaceToSpaceMigrationHandlerTool(toolsWithNulls);

    const testArgs = {
      ...mockMigrationHandlerArgs,
      enableWorkflow: true,
    };

    const result = await handlerWithNulls(testArgs);

    // Verify only valid tools were enabled
    expect(mockTool1.enable).toHaveBeenCalledTimes(1);
    expect(mockTool2.enable).toHaveBeenCalledTimes(1);
    expect(mockTool3.enable).toHaveBeenCalledTimes(1);

    expect(result.content[0].text).toContain(
      'Space to space migration workflow started',
    );
  });

  it('should handle tool enable/disable method failures gracefully', async () => {
    // Make one tool throw an error
    vi.mocked(mockTool2.enable).mockImplementation(() => {
      throw new Error('Tool enable failed');
    });

    const testArgs = {
      ...mockMigrationHandlerArgs,
      enableWorkflow: true,
    };

    // The migration handler uses withErrorHandling, so errors are caught and returned as error responses
    const result = await migrationHandlerTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error managing space to space migration workflow: Tool enable failed',
        },
      ],
    });

    // Tools should still be called in order until the error
    expect(mockTool1.enable).toHaveBeenCalledTimes(1);
    expect(mockTool2.enable).toHaveBeenCalledTimes(1);
  });

  it('should handle disable workflow with tool failures', async () => {
    // Make one tool throw an error on disable
    vi.mocked(mockTool1.disable).mockImplementation(() => {
      throw new Error('Tool disable failed');
    });

    const testArgs = {
      ...mockMigrationHandlerArgs,
      enableWorkflow: false,
    };

    // The migration handler uses withErrorHandling, so errors are caught and returned as error responses
    const result = await migrationHandlerTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error managing space to space migration workflow: Tool disable failed',
        },
      ],
    });

    // Tools should still be called in order until the error
    expect(mockTool1.disable).toHaveBeenCalledTimes(1);
  });

  it('should return correct instructions for enable workflow', async () => {
    const testArgs = {
      ...mockMigrationHandlerArgs,
      enableWorkflow: true,
    };

    const result = await migrationHandlerTool(testArgs);

    expect(result.content[0].text).toContain(
      'You are a helpful assistant that can help with space to space migration',
    );
  });

  it('should return correct instructions for disable workflow', async () => {
    const testArgs = {
      ...mockMigrationHandlerArgs,
      enableWorkflow: false,
    };

    const result = await migrationHandlerTool(testArgs);

    expect(result.content[0].text).toContain(
      'The space to space migration workflow has been concluded',
    );
  });

  it('should handle boolean parameter correctly', async () => {
    // Test with explicit boolean values
    const enableResult = await migrationHandlerTool({
      spaceId: 'test-space',
      environmentId: 'test-env',
      enableWorkflow: true,
    });
    const disableResult = await migrationHandlerTool({
      spaceId: 'test-space',
      environmentId: 'test-env',
      enableWorkflow: false,
    });

    expect(enableResult.content[0].text).toContain('workflow started');
    expect(disableResult.content[0].text).toContain('workflow concluded');

    // Verify the correct number of enable/disable calls
    expect(mockTool1.enable).toHaveBeenCalledTimes(1);
    expect(mockTool1.disable).toHaveBeenCalledTimes(1);
    expect(mockTool2.enable).toHaveBeenCalledTimes(1);
    expect(mockTool2.disable).toHaveBeenCalledTimes(1);
    expect(mockTool3.enable).toHaveBeenCalledTimes(1);
    expect(mockTool3.disable).toHaveBeenCalledTimes(1);
  });

  it('should include enableWorkflow value in response data', async () => {
    const enableArgs = {
      spaceId: 'test-space',
      environmentId: 'test-env',
      enableWorkflow: true,
    };
    const disableArgs = {
      spaceId: 'test-space',
      environmentId: 'test-env',
      enableWorkflow: false,
    };

    const enableResult = await migrationHandlerTool(enableArgs);
    const disableResult = await migrationHandlerTool(disableArgs);

    expect(enableResult.content[0].text).toContain(
      '<enableWorkflow>true</enableWorkflow>',
    );
    expect(disableResult.content[0].text).toContain('workflow concluded');
  });
});
