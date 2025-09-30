import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ListOrgsToolParams, listOrgsTool } from './listOrgs.js';
import { GetOrgToolParams, getOrgTool } from './getOrg.js';

export function registerOrgTools(server: McpServer) {
  server.registerTool(
    'list_orgs',
    {
      description: 'List all organizations that the user has access to',
      inputSchema: ListOrgsToolParams.shape,
    },
    listOrgsTool,
  );

  server.registerTool(
    'get_org',
    {
      description: 'Get details of a specific organization',
      inputSchema: GetOrgToolParams.shape,
    },
    getOrgTool,
  );
}
