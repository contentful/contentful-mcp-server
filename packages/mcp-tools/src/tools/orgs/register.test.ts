import { describe, it, expect, vi } from 'vitest';
import { registerOrgTools } from './register.js';
import { ListOrgsToolParams } from './listOrgs.js';
import { GetOrgToolParams } from './getOrg.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('registerOrgTools', () => {
  it('should register all organization tools', () => {
    const mockServer = {
      tool: vi.fn(),
    };

    registerOrgTools(mockServer as unknown as McpServer);

    expect(mockServer.tool).toHaveBeenCalledWith(
      'list_orgs',
      'List all organizations that the user has access to',
      ListOrgsToolParams.shape,
      expect.any(Function),
    );

    expect(mockServer.tool).toHaveBeenCalledWith(
      'get_org',
      'Get details of a specific organization',
      GetOrgToolParams.shape,
      expect.any(Function),
    );

    expect(mockServer.tool).toHaveBeenCalledTimes(2);
  });
});
