import { describe, it, expect } from 'vitest';
import { createOrgTools } from './register.js';
import { ListOrgsToolParams } from './listOrgs.js';
import { GetOrgToolParams } from './getOrg.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('organization tools collection', () => {
  const mockConfig = createMockConfig();

  it('should export createOrgTools factory function', () => {
    expect(createOrgTools).toBeDefined();
    expect(typeof createOrgTools).toBe('function');
  });

  it('should create orgTools collection with correct structure', () => {
    const orgTools = createOrgTools(mockConfig);
    expect(orgTools).toBeDefined();
    expect(Object.keys(orgTools)).toHaveLength(2);
  });

  it('should have listOrgs tool with correct properties', () => {
    const orgTools = createOrgTools(mockConfig);
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
    expect(listOrgs.tool).toBeDefined();
    expect(typeof listOrgs.tool).toBe('function');
  });

  it('should have getOrg tool with correct properties', () => {
    const orgTools = createOrgTools(mockConfig);
    const { getOrg } = orgTools;

    expect(getOrg.title).toBe('get_org');
    expect(getOrg.description).toBe('Get details of a specific organization');
    expect(getOrg.inputParams).toStrictEqual(GetOrgToolParams.shape);
    expect(getOrg.annotations).toEqual({
      readOnlyHint: true,
      openWorldHint: false,
    });
    expect(getOrg.tool).toBeDefined();
    expect(typeof getOrg.tool).toBe('function');
  });
});
