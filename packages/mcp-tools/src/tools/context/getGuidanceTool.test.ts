import { describe, it, expect } from 'vitest';
import { getGuidanceTool } from './getGuidanceTool.js';
import { GUIDANCE, GUIDANCE_TOPICS } from './instructions.js';

describe('get_guidance', () => {
  const tool = getGuidanceTool();

  it('returns the section for each valid topic', async () => {
    for (const topic of GUIDANCE_TOPICS) {
      const res = await tool({ topic });
      expect(res.isError).toBeFalsy();
      expect(res.content[0].text).toBe(GUIDANCE[topic]);
    }
  });

  it('returns an error response for an unknown topic', async () => {
    // Cast past the type to simulate a bad runtime value.
    const res = await tool({ topic: 'bogus' as (typeof GUIDANCE_TOPICS)[number] });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('Unknown guidance topic');
  });
});
