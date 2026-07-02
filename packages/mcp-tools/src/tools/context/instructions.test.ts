import { describe, it, expect } from 'vitest';
import {
  CORE_INVARIANTS,
  GUIDANCE,
  GUIDANCE_TOPICS,
} from './instructions.js';

// Terms the 2026-07-02 audit proved are fiction. They must never appear
// in any shipped context content. This test encodes the audit as a guard.
const FICTION = [
  'get_content_types',
  'entry_action',
  'patch_entry',
  'transform_entry',
  'translate_entry',
  'transform_image',
  'start_space_to_space_migration',
  'async',
  '5 (five)',
  'maximum of 5',
];

describe('guidance corpus', () => {
  const allContent = [CORE_INVARIANTS, ...Object.values(GUIDANCE)].join('\n');

  it('exposes exactly the three guidance topics', () => {
    expect(GUIDANCE_TOPICS).toEqual(['searching', 'editing', 'conventions']);
  });

  it('has a non-empty section for every topic', () => {
    for (const topic of GUIDANCE_TOPICS) {
      expect(GUIDANCE[topic]).toBeTruthy();
      expect(GUIDANCE[topic].length).toBeGreaterThan(0);
    }
  });

  it('contains none of the audit-identified fiction', () => {
    for (const term of FICTION) {
      expect(allContent).not.toContain(term);
    }
  });

  it('states the corrected load-bearing facts', () => {
    // Real content-type verbs
    expect(allContent).toContain('list_content_types');
    expect(allContent).toContain('get_content_type');
    // Real bulk cap
    expect(CORE_INVARIANTS).toContain('10');
    // sys.version edit-safety rule
    expect(allContent).toContain('sys.version');
    expect(allContent).toContain('update_entry');
  });
});
