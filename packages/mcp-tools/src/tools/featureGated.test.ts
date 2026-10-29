import { describe, expect, it } from 'vitest';
import { createAiActionTools } from './ai-actions/register.js';
import { createEntryTools } from './entries/register.js';
import { FEATURE_GATED_META } from '../utils/response.js';
import { createMockConfig } from '../test-helpers/mockConfig.js';

describe('feature-gated tools', () => {
  const config = createMockConfig();
  const entryTools = createEntryTools(config);

  it('flags semantic search and every AI action tool', () => {
    const gated = [
      entryTools.semanticSearch,
      ...Object.values(createAiActionTools(config)),
    ];
    for (const tool of gated) expect(tool._meta).toEqual(FEATURE_GATED_META);
  });

  it('does not flag other tools', () => {
    expect('_meta' in entryTools.getEntry).toBe(false);
  });
});
