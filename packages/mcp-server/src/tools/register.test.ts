import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerAllTools } from './register.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ContentfulMcpTools } from '@contentful/mcp-tools';
import { env } from '../config/env.js';

// Mutable data object — tests can override individual fields before calling registerAllTools.
// ENABLE_EXO_TOOLS is a boolean here (the real env schema transforms the string to a boolean).
const mockEnvData: Record<string, string | boolean | undefined> = {
  CONTENTFUL_MANAGEMENT_ACCESS_TOKEN: 'test-token',
  CONTENTFUL_HOST: 'api.contentful.com',
  SPACE_ID: 'test-space-id',
  ENVIRONMENT_ID: 'master',
  ORGANIZATION_ID: 'test-org-id',
  APP_ID: 'test-app-id',
  PROTECTED_ENVIRONMENTS: undefined,
  ENABLE_EXO_TOOLS: true,
};

// Mock the env module — references the mutable object above so tests can mutate it
vi.mock('../config/env.js', () => ({
  env: {
    success: true,
    get data() {
      return mockEnvData;
    },
  },
}));

vi.mock('@contentful/mcp-tools', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@contentful/mcp-tools')>();
  return {
    ...actual,
    ContentfulMcpTools: vi
      .fn()
      .mockImplementation((config) => new actual.ContentfulMcpTools(config)),
  };
});

describe('registerAllTools', () => {
  let mockServer: McpServer;
  let registerToolSpy: ReturnType<typeof vi.fn>;
  let mockRegisteredTool: { disable: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Reset PROTECTED_ENVIRONMENTS to absent for existing tests
    mockEnvData.PROTECTED_ENVIRONMENTS = undefined;

    // Default ExO tools on so existing tests keep seeing the full tool surface
    mockEnvData.ENABLE_EXO_TOOLS = true;

    // Create mock registered tool with disable method
    mockRegisteredTool = {
      disable: vi.fn(),
    };

    // Create mock server with registerTool method
    registerToolSpy = vi.fn(() => mockRegisteredTool);
    mockServer = {
      registerTool: registerToolSpy,
    } as unknown as McpServer;

    vi.mocked(ContentfulMcpTools).mockClear();
  });

  it('should register all standard tool collections', async () => {
    registerAllTools(mockServer);

    // Create a ContentfulMcpTools instance to count tools
    const mcpTools = new ContentfulMcpTools({
      accessToken: env.data!.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN,
      host: env.data!.CONTENTFUL_HOST,
      spaceId: env.data!.SPACE_ID,
      environmentId: env.data!.ENVIRONMENT_ID,
      organizationId: env.data!.ORGANIZATION_ID,
      appId: env.data!.APP_ID,
      mcpVersion: '0.0.0',
    });

    // Count expected tool registrations from standard collections
    const standardToolCollections = [
      mcpTools.getAiActionTools(),
      mcpTools.getAssetTools(),
      mcpTools.getComponentTypeTools(),
      mcpTools.getDataAssemblyTools(),
      mcpTools.getExperienceTools(),
      mcpTools.getTemplateTools(),
      mcpTools.getContentTypeTools(),
      mcpTools.getContextTools(),
      mcpTools.getEditorInterfaceTools(),
      mcpTools.getEntryTools(),
      mcpTools.getEnvironmentTools(),
      mcpTools.getFragmentTools(),
      mcpTools.getLocaleTools(),
      mcpTools.getOrgTools(),
      mcpTools.getSpaceTools(),
      mcpTools.getTagTools(),
      mcpTools.getTaxonomyTools(),
    ];

    const expectedStandardToolCount = standardToolCollections.reduce(
      (count, collection) => count + Object.keys(collection).length,
      0,
    );

    // Add workflow tools (3) and migration handler (1)
    const expectedTotalCalls = expectedStandardToolCount + 3 + 1;

    expect(registerToolSpy).toHaveBeenCalledTimes(expectedTotalCalls);
  });

  it('should register tools with correct metadata structure', async () => {
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

  it('should register workflow tools with disable called', async () => {
    registerAllTools(mockServer);

    // The disable method should be called 3 times (once for each workflow tool)
    expect(mockRegisteredTool.disable).toHaveBeenCalledTimes(3);
  });

  it('should register spaceToSpaceMigrationHandler with workflow tools', async () => {
    registerAllTools(mockServer);

    const mcpTools = new ContentfulMcpTools({
      accessToken: env.data!.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN,
      host: env.data!.CONTENTFUL_HOST,
      spaceId: env.data!.SPACE_ID,
      environmentId: env.data!.ENVIRONMENT_ID,
      organizationId: env.data!.ORGANIZATION_ID,
      appId: env.data!.APP_ID,
      mcpVersion: '0.0.0',
    });
    const handlerConfig = mcpTools.getJobTools().spaceToSpaceMigrationHandler;

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

describe('registerAllTools ExO opt-in', () => {
  let registerToolSpy: ReturnType<typeof vi.fn>;
  let mockServer: McpServer;

  beforeEach(() => {
    mockEnvData.ENABLE_EXO_TOOLS = true;
    registerToolSpy = vi.fn(() => ({ disable: vi.fn() }));
    mockServer = { registerTool: registerToolSpy } as unknown as McpServer;
    vi.mocked(ContentfulMcpTools).mockClear();
  });

  const registeredToolTitles = () =>
    registerToolSpy.mock.calls.map((c) => c[0] as string);

  it('registers ExO tools and sets exoToolsRegistered:true when ENABLE_EXO_TOOLS is on', () => {
    mockEnvData.ENABLE_EXO_TOOLS = true;

    registerAllTools(mockServer);

    // create_component_type is an ExO tool title
    expect(registeredToolTitles()).toContain('create_component_type');
    // classic tools still present alongside ExO
    expect(registeredToolTitles()).toContain('list_content_types');
    expect(vi.mocked(ContentfulMcpTools)).toHaveBeenCalledWith(
      expect.objectContaining({ exoToolsRegistered: true }),
    );
  });

  it('omits ExO tools and sets exoToolsRegistered:false when ENABLE_EXO_TOOLS is off', () => {
    mockEnvData.ENABLE_EXO_TOOLS = false;

    registerAllTools(mockServer);

    expect(registeredToolTitles()).not.toContain('create_component_type');
    // classic tools still present
    expect(registeredToolTitles()).toContain('list_content_types');
    expect(vi.mocked(ContentfulMcpTools)).toHaveBeenCalledWith(
      expect.objectContaining({ exoToolsRegistered: false }),
    );
  });
});

describe('registerAllTools — PROTECTED_ENVIRONMENTS parsing', () => {
  let mockServer: McpServer;
  let mockRegisteredTool: { disable: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockRegisteredTool = { disable: vi.fn() };
    mockServer = {
      registerTool: vi.fn(() => mockRegisteredTool),
    } as unknown as McpServer;

    vi.mocked(ContentfulMcpTools).mockClear();
  });

  it('passes undefined when PROTECTED_ENVIRONMENTS is absent', async () => {
    mockEnvData.PROTECTED_ENVIRONMENTS = undefined;
    registerAllTools(mockServer);
    expect(vi.mocked(ContentfulMcpTools)).toHaveBeenCalledWith(
      expect.objectContaining({ protectedEnvironments: undefined }),
    );
  });

  it('passes parsed array when PROTECTED_ENVIRONMENTS is "master,staging"', async () => {
    mockEnvData.PROTECTED_ENVIRONMENTS = 'master,staging';
    registerAllTools(mockServer);
    expect(vi.mocked(ContentfulMcpTools)).toHaveBeenCalledWith(
      expect.objectContaining({ protectedEnvironments: ['master', 'staging'] }),
    );
  });

  it('trims whitespace when PROTECTED_ENVIRONMENTS is " master , staging "', async () => {
    mockEnvData.PROTECTED_ENVIRONMENTS = ' master , staging ';
    registerAllTools(mockServer);
    expect(vi.mocked(ContentfulMcpTools)).toHaveBeenCalledWith(
      expect.objectContaining({ protectedEnvironments: ['master', 'staging'] }),
    );
  });

  it('passes undefined when PROTECTED_ENVIRONMENTS is only commas/whitespace (", ,")', async () => {
    mockEnvData.PROTECTED_ENVIRONMENTS = ', ,';
    registerAllTools(mockServer);
    expect(vi.mocked(ContentfulMcpTools)).toHaveBeenCalledWith(
      expect.objectContaining({ protectedEnvironments: undefined }),
    );
  });
});
