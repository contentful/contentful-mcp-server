import { describe, it, expect } from 'vitest';
import { orgTools } from './register.js';
import { listOrgsTool, ListOrgsToolParams } from './listOrgs.js';
import { getOrgTool, GetOrgToolParams } from './getOrg.js';

describe('organization tools collection', () => {
  it('should export orgTools collection with correct structure', () => {
    expect(orgTools).toBeDefined();
    expect(Object.keys(orgTools)).toHaveLength(2);
  });

  it('should have listOrgs tool with correct properties', () => {
    const { listOrgs } = orgTools;

    expect(listOrgs.title).toBe('list_orgs');
    expect(listOrgs.description).toBe(
      'List all organizations that the user has access to',
    );
    expect(listOrgs.inputParams).toStrictEqual(ListOrgsToolParams.shape);
    expect(listOrgs.annotations).toEqual({
      readOnlyHint: true,
      openWorldHint: false,
    });
    expect(listOrgs.tool).toBe(listOrgsTool);
  });

  it('should have getOrg tool with correct properties', () => {
    const { getOrg } = orgTools;

    expect(getOrg.title).toBe('get_org');
    expect(getOrg.description).toBe('Get details of a specific organization');
    expect(getOrg.inputParams).toStrictEqual(GetOrgToolParams.shape);
    expect(getOrg.annotations).toEqual({
      readOnlyHint: true,
      openWorldHint: false,
    });
    expect(getOrg.tool).toBe(getOrgTool);
  });
});
