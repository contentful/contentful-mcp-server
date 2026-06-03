/**
 * Safety guards for tools that accept arrays of IDs (publish/unpublish/
 * archive/unarchive entries and assets). Two protections are exposed:
 *
 *   1. `assertBulkSizeAllowed` — blocks calls that exceed `MAX_BULK_SIZE`.
 *      Default 10. Configurable per-server (env var on local, OAuth-time
 *      input on remote). Mitigates the catastrophic "AI hallucinated 100
 *      entry IDs for deletion" failure mode flagged by Klarna and TELUS.
 *
 *   2. `buildDryRunPreview` — returns what would happen without executing.
 *      Tools accept `dryRun: true` and short-circuit before any CMA call.
 *      Delete tools deliberately do NOT use this — DX-1057's two-phase
 *      confirmation already provides equivalent preview behavior.
 */

export const DEFAULT_MAX_BULK_SIZE = 10;

export function resolveMaxBulkSize(configured: number | undefined): number {
  if (
    configured === undefined ||
    !Number.isInteger(configured) ||
    configured <= 0
  ) {
    return DEFAULT_MAX_BULK_SIZE;
  }
  return configured;
}

export function assertBulkSizeAllowed(
  count: number,
  configured: number | undefined,
): void {
  const limit = resolveMaxBulkSize(configured);
  if (count > limit) {
    throw new Error(
      `Bulk operation rejected: ${count} IDs exceeds MAX_BULK_SIZE of ${limit}. Reduce batch size or increase the limit.`,
    );
  }
}

export type DryRunOperation = 'publish' | 'unpublish' | 'archive' | 'unarchive';

export type DryRunEntityType = 'entry' | 'asset';

export interface DryRunPreviewInput {
  operation: DryRunOperation;
  entityType: DryRunEntityType;
  ids: string[];
  spaceId: string;
  environmentId: string;
}

export interface DryRunPreview {
  dryRun: true;
  operation: DryRunOperation;
  entityType: DryRunEntityType;
  count: number;
  ids: string[];
  target: { spaceId: string; environmentId: string };
  message: string;
}

export function buildDryRunPreview(input: DryRunPreviewInput): DryRunPreview {
  const { operation, entityType, ids, spaceId, environmentId } = input;
  return {
    dryRun: true,
    operation,
    entityType,
    count: ids.length,
    ids,
    target: { spaceId, environmentId },
    message: `Dry run: would ${operation} ${ids.length} ${entityType}(ies) in ${spaceId}/${environmentId}. No changes were made. Re-run without dryRun to execute.`,
  };
}
