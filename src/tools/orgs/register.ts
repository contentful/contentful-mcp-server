import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ListOrgsToolParams, listOrgsTool } from './listOrgs.js';
import { GetOrgToolParams, getOrgTool } from './getOrg.js';

export function registerOrgTools(server: McpServer) {
  server.tool(
    'list_orgs',
    'List all organizations that the user has access to',
    ListOrgsToolParams.shape,
    listOrgsTool,
  );

  server.tool(
    'get_org',
    'Get details of a specific organization',
    GetOrgToolParams.shape,
    getOrgTool,
  );
}
