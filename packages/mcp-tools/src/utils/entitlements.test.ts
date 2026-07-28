import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRawGet, mockGetAllOrgs, mockCreateClient } = vi.hoisted(() => {
  const mockRawGet = vi.fn();
  const mockGetAllOrgs = vi.fn();
  return {
    mockRawGet,
    mockGetAllOrgs,
    mockCreateClient: vi.fn(() => ({
      raw: { get: mockRawGet },
      organization: { getAll: mockGetAllOrgs },
    })),
  };
});

vi.mock('contentful-management', () => ({
  createClient: mockCreateClient,
}));

import { hasExoM1Entitlement } from './entitlements.js';
import type { ContentfulConfig } from '../config/types.js';

const config: ContentfulConfig = {
  accessToken: 'tok',
  mcpVersion: '0.0.0',
};

const orgsCollection = (...ids: string[]) => ({
  items: ids.map((id) => ({ sys: { id } })),
});

/** Route raw.get responses per-org by URL. */
const entitlementByOrg = (map: Record<string, boolean>) => (url: string) => {
  const match = url.match(/\/organizations\/([^/]+)\//);
  const orgId = match?.[1] ?? '';
  return Promise.resolve({ features: { exoM1: { value: map[orgId] ?? false } } });
};

describe('hasExoM1Entitlement', () => {
  beforeEach(() => {
    mockRawGet.mockReset();
    mockGetAllOrgs.mockReset();
    mockCreateClient.mockClear();
  });

  it('returns true when the user is entitled in their only org', async () => {
    mockGetAllOrgs.mockResolvedValue(orgsCollection('org-1'));
    mockRawGet.mockImplementation(entitlementByOrg({ 'org-1': true }));

    const result = await hasExoM1Entitlement(config);

    expect(result).toBe(true);
    expect(mockRawGet).toHaveBeenCalledWith(
      '/organizations/org-1/organization_entitlement_set',
    );
    // plain client is required for the raw + organization surfaces
    expect(mockCreateClient).toHaveBeenCalledWith(expect.anything(), {
      type: 'plain',
    });
  });

  it('returns true when ANY of several orgs is entitled', async () => {
    mockGetAllOrgs.mockResolvedValue(orgsCollection('org-1', 'org-2', 'org-3'));
    mockRawGet.mockImplementation(entitlementByOrg({ 'org-2': true }));

    expect(await hasExoM1Entitlement(config)).toBe(true);
    expect(mockRawGet).toHaveBeenCalledTimes(3);
  });

  it('returns false when no org is entitled', async () => {
    mockGetAllOrgs.mockResolvedValue(orgsCollection('org-1', 'org-2'));
    mockRawGet.mockImplementation(entitlementByOrg({}));

    expect(await hasExoM1Entitlement(config)).toBe(false);
  });

  it('returns false when the user belongs to no orgs', async () => {
    mockGetAllOrgs.mockResolvedValue(orgsCollection());

    expect(await hasExoM1Entitlement(config)).toBe(false);
    expect(mockRawGet).not.toHaveBeenCalled();
  });

  it('fails closed on a single org even if its entitlement lookup errors, still honoring others', async () => {
    mockGetAllOrgs.mockResolvedValue(orgsCollection('org-1', 'org-2'));
    mockRawGet.mockImplementation((url: string) => {
      if (url.includes('org-1')) return Promise.reject(new Error('403'));
      return Promise.resolve({ features: { exoM1: { value: true } } });
    });

    // org-1 lookup fails closed, org-2 is entitled → overall true
    expect(await hasExoM1Entitlement(config)).toBe(true);
  });

  it('returns false and does not throw when listing orgs errors (fail closed / offline)', async () => {
    mockGetAllOrgs.mockRejectedValue(new Error('ENOTFOUND'));

    expect(await hasExoM1Entitlement(config)).toBe(false);
  });

  it('returns false when the exoM1 feature object has no value key', async () => {
    mockGetAllOrgs.mockResolvedValue(orgsCollection('org-1'));
    mockRawGet.mockResolvedValue({ features: { exoM1: {} } });

    expect(await hasExoM1Entitlement(config)).toBe(false);
  });

  it('coerces a truthy-but-non-true feature value to false', async () => {
    mockGetAllOrgs.mockResolvedValue(orgsCollection('org-1'));
    mockRawGet.mockResolvedValue({ features: { exoM1: { value: 'yes' } } });

    expect(await hasExoM1Entitlement(config)).toBe(false);
  });
});
