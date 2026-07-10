import { createClient } from 'contentful-management';
import type { ContentfulConfig } from '../config/types.js';
import { createClientConfig } from './tools.js';

/** Feature name for the shared ExO M1 rollout entitlement. */
export const EXO_M1_FEATURE = 'exoM1';

/**
 * Minimal shape of the organization entitlement set we care about. Each feature
 * is an object `{ value: boolean }`, not a bare boolean.
 */
interface OrganizationEntitlementSet {
  features?: Record<string, { value?: boolean } | undefined>;
}

type PlainClient = ReturnType<typeof createPlainClient>;

function createPlainClient(config: ContentfulConfig) {
  return createClient(createClientConfig(config), { type: 'plain' });
}

/**
 * Checks the exoM1 entitlement for a single organization via the public CMA
 * endpoint `GET /organizations/{orgId}/organization_entitlement_set` — the same
 * path browser callers use (see experience-packages' ContentOpsEntitlements).
 * Fails CLOSED per-org: any error (403 on an org where the user isn't an admin,
 * network, malformed body) returns false so it never sinks the overall check.
 */
async function orgHasExoM1(
  client: PlainClient,
  organizationId: string,
): Promise<boolean> {
  try {
    const entitlements = await client.raw.get<OrganizationEntitlementSet>(
      `/organizations/${organizationId}/organization_entitlement_set`,
    );
    return entitlements.features?.[EXO_M1_FEATURE]?.value === true;
  } catch {
    return false;
  }
}

/**
 * Checks whether the user (identified solely by their management token) has the
 * shared ExO M1 entitlement in ANY organization they can access.
 *
 * The local server takes `spaceId`/`organizationId` per tool call, not as
 * required config, so at registration time there is no single authoritative org
 * to scope to. We therefore derive orgs from the PAT: list every org the token
 * can reach (`organization.getAll`) and register ExO if at least one is
 * entitled. Combined with the `ENABLE_EXO_TOOLS` opt-in (the primary gate),
 * this answers "does this user have ExO access anywhere?".
 *
 * The Node-only `@contentful/entitlements-api-client` and its internal cluster
 * URL are not used (unreachable from a locally-run server).
 *
 * Fails CLOSED: any error (offline, network, no accessible orgs) returns false,
 * so the caller withholds ExO tools rather than exposing them unentitled.
 */
export async function hasExoM1Entitlement(
  config: ContentfulConfig,
): Promise<boolean> {
  try {
    const client = createPlainClient(config);
    const orgs = await client.organization.getAll();
    if (!orgs.items.length) {
      return false;
    }
    const results = await Promise.all(
      orgs.items.map((org) => orgHasExoM1(client, org.sys.id)),
    );
    return results.some(Boolean);
  } catch {
    return false;
  }
}
