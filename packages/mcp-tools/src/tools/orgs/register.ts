import { ListOrgsToolParams, listOrgsTool } from './listOrgs.js';
import { GetOrgToolParams, getOrgTool } from './getOrg.js';
import type { ContentfulConfig } from '../../config/types.js';

export function createOrgTools(config: ContentfulConfig) {
  const listOrgs = listOrgsTool(config);
  const getOrg = getOrgTool(config);

  return {
    listOrgs: {
      title: 'list_orgs',
      description: 'List all organizations that the user has access to',
      inputParams: ListOrgsToolParams.shape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
      tool: listOrgs,
    },
    getOrg: {
      title: 'get_org',
      description: 'Get details of a specific organization',
      inputParams: GetOrgToolParams.shape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
      tool: getOrg,
    },
  };
}
