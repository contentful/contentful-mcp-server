import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerAllTools } from './register.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  aiActionTools,
  assetTools,
  contentTypeTools,
  contextTools,
  entryTools,
  environmentTools,
  jobTools,
  localeTools,
  orgTools,
  spaceTools,
  tagTools,
  taxonomyTools,
} from '@contentful/mcp-tools';

describe('registerAllTools', () => {
  let mockServer: McpServer;
  let registerToolSpy: ReturnType<typeof vi.fn>;
  let mockRegisteredTool: { disable: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Create mock registered tool with disable method
    mockRegisteredTool = {
      disable: vi.fn(),
    };

    // Create mock server with registerTool method
    registerToolSpy = vi.fn(() => mockRegisteredTool);
    mockServer = {
      registerTool: registerToolSpy,
    } as unknown as McpServer;
  });

  it('should register all standard tool collections', () => {
    registerAllTools(mockServer);

    // Count expected tool registrations from standard collections
    const standardToolCollections = [
      aiActionTools,
      assetTools,
      contentTypeTools,
      contextTools,
      entryTools,
      environmentTools,
      localeTools,
      orgTools,
      spaceTools,
      tagTools,
      taxonomyTools,
    ];

    const expectedStandardToolCount = standardToolCollections.reduce(
      (count, collection) => count + Object.keys(collection).length,
      0,
    );

    // Add workflow tools (3) and migration handler (1)
    const expectedTotalCalls = expectedStandardToolCount + 3 + 1;

    expect(registerToolSpy).toHaveBeenCalledTimes(expectedTotalCalls);
  });

  it('should register tools with correct metadata structure', () => {
    registerAllTools(mockServer);

    // Check that all calls follow the expected structure
    const calls = registerToolSpy.mock.calls;
    calls.forEach((call) => {
      expect(call).toHaveLength(3);
      expect(typeof call[0]).toBe('string'); // title
      expect(call[1]).toHaveProperty('description');
      expect(call[1]).toHaveProperty('inputSchema');
      expect(call[1]).toHaveProperty('annotations');
      expect(typeof call[2]).toBe('function'); // tool implementation
    });
  });

  it('should register workflow tools with disable called', () => {
    registerAllTools(mockServer);

    // The disable method should be called 3 times (once for each workflow tool)
    expect(mockRegisteredTool.disable).toHaveBeenCalledTimes(3);
  });

  it('should register spaceToSpaceMigrationHandler with workflow tools', () => {
    registerAllTools(mockServer);

    const handlerConfig = jobTools.spaceToSpaceMigrationHandler;

    // Find the call for the migration handler
    const handlerCall = registerToolSpy.mock.calls.find(
      (call) => call[0] === handlerConfig.title,
    );

    expect(handlerCall).toBeDefined();
    if (!handlerCall) return;

    expect(handlerCall[0]).toBe(handlerConfig.title);
    expect(handlerCall[1]).toEqual({
      description: handlerConfig.description,
      inputSchema: handlerConfig.inputParams,
      annotations: handlerConfig.annotations,
    });
    // The tool should be the result of calling handlerConfig.tool with workflow tools
    expect(typeof handlerCall[2]).toBe('function');
  });
});
