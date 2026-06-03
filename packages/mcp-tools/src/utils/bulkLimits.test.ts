import { describe, it, expect } from 'vitest';
import {
  DEFAULT_MAX_BULK_SIZE,
  resolveMaxBulkSize,
  assertBulkSizeAllowed,
  buildDryRunPreview,
} from './bulkLimits.js';

describe('resolveMaxBulkSize', () => {
  it('returns the default when config value is undefined', () => {
    expect(resolveMaxBulkSize(undefined)).toBe(DEFAULT_MAX_BULK_SIZE);
    expect(DEFAULT_MAX_BULK_SIZE).toBe(10);
  });

  it('returns the configured value when valid', () => {
    expect(resolveMaxBulkSize(25)).toBe(25);
  });

  it('falls back to the default for non-positive values', () => {
    expect(resolveMaxBulkSize(0)).toBe(DEFAULT_MAX_BULK_SIZE);
    expect(resolveMaxBulkSize(-5)).toBe(DEFAULT_MAX_BULK_SIZE);
  });

  it('falls back to the default for non-integer values', () => {
    expect(resolveMaxBulkSize(3.5)).toBe(DEFAULT_MAX_BULK_SIZE);
    expect(resolveMaxBulkSize(Number.NaN)).toBe(DEFAULT_MAX_BULK_SIZE);
  });
});

describe('assertBulkSizeAllowed', () => {
  it('does not throw when count is within the limit', () => {
    expect(() => assertBulkSizeAllowed(5, 10)).not.toThrow();
    expect(() => assertBulkSizeAllowed(10, 10)).not.toThrow();
  });

  it('throws a descriptive error when count exceeds the limit', () => {
    expect(() => assertBulkSizeAllowed(47, 10)).toThrowError(
      'Bulk operation rejected: 47 IDs exceeds MAX_BULK_SIZE of 10. Reduce batch size or increase the limit.',
    );
  });

  it('uses the resolved default when limit is undefined', () => {
    expect(() => assertBulkSizeAllowed(11, undefined)).toThrowError(
      'Bulk operation rejected: 11 IDs exceeds MAX_BULK_SIZE of 10. Reduce batch size or increase the limit.',
    );
  });
});

describe('buildDryRunPreview', () => {
  it('builds a preview describing the operation without side effects', () => {
    const preview = buildDryRunPreview({
      operation: 'publish',
      entityType: 'entry',
      ids: ['a', 'b', 'c'],
      spaceId: 'space-1',
      environmentId: 'master',
    });

    expect(preview).toEqual({
      dryRun: true,
      operation: 'publish',
      entityType: 'entry',
      count: 3,
      ids: ['a', 'b', 'c'],
      target: { spaceId: 'space-1', environmentId: 'master' },
      message:
        'Dry run: would publish 3 entry(ies) in space-1/master. No changes were made. Re-run without dryRun to execute.',
    });
  });
});
