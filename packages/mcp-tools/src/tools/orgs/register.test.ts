import { describe, it, expect, vi } from 'vitest';
import { registerGetOrgTool, registerListOrgsTool } from './register.js';
import { ListOrgsToolParams } from './listOrgs.js';
import { GetOrgToolParams } from './getOrg.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('organization registration helpers', () => {
  it('should register all organization tools', () => {
    const mockServer = {
      registerTool: vi.fn(),
    };

    registerListOrgsTool(mockServer as unknown as McpServer);
    registerGetOrgTool(mockServer as unknown as McpServer);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'list_orgs',
      {
        description: 'List all organizations that the user has access to',
        inputSchema: ListOrgsToolParams.shape,
      },
      expect.any(Function),
    );

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'get_org',
      {
        description: 'Get details of a specific organization',
        inputSchema: GetOrgToolParams.shape,
      },
      expect.any(Function),
    );

    expect(mockServer.registerTool).toHaveBeenCalledTimes(2);
  });
});
