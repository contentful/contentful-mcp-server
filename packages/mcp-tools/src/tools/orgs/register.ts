import { ListOrgsToolParams, listOrgsTool } from './listOrgs.js';
import { GetOrgToolParams, getOrgTool } from './getOrg.js';

export const orgTools = {
  listOrgs: {
    title: 'list_orgs',
    description: 'List all organizations that the user has access to',
    inputParams: ListOrgsToolParams.shape,
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
    tool: listOrgsTool,
  },
  getOrg: {
    title: 'get_org',
    description: 'Get details of a specific organization',
    inputParams: GetOrgToolParams.shape,
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
    tool: getOrgTool,
  },
};
