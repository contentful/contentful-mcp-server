import { describe, it, expect } from 'vitest';
import { createUsageTools } from './register.js';
import { GetUsagesToolParams } from './getUsages.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('usage tools collection', () => {
  const mockConfig = createMockConfig();

  it('should export createUsageTools factory function', () => {
    expect(createUsageTools).toBeDefined();
    expect(typeof createUsageTools).toBe('function');
  });

  it('should create usageTools collection with correct structure', () => {
    const usageTools = createUsageTools(mockConfig);
    expect(usageTools).toBeDefined();
    expect(Object.keys(usageTools)).toHaveLength(1);
  });

  it('should have getUsages tool with correct properties', () => {
    const usageTools = createUsageTools(mockConfig);
    const { getUsages } = usageTools;

    expect(getUsages.title).toBe('get_usages');
    expect(getUsages.description).toContain(
      'aggregated usage metrics for a Contentful organization',
    );
    expect(getUsages.inputParams).toStrictEqual(GetUsagesToolParams.shape);
    expect(getUsages.annotations).toEqual({
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    });
    expect(getUsages.tool).toBeDefined();
    expect(typeof getUsages.tool).toBe('function');
  });
});
