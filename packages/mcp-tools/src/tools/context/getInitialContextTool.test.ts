import { describe, it, expect } from 'vitest';
import { getInitialContextTool } from './getInitialContextTool.js';
import { CORE_INVARIANTS, GUIDANCE_TOPICS } from './instructions.js';
import type { ContentfulConfig } from '../../config/types.js';

const config: ContentfulConfig = {
  accessToken: 'tok',
  mcpVersion: '1.0.0',
  spaceId: 'space123',
  environmentId: 'staging',
  organizationId: 'org456',
};

describe('get_initial_context (tiered index)', () => {
  const tool = getInitialContextTool(config);

  it('returns session facts from config', async () => {
    const text = (await tool({})).content[0].text;
    expect(text).toContain('space123');
    expect(text).toContain('staging');
    expect(text).toContain('org456');
  });

  it('includes the core invariants inline', async () => {
    const text = (await tool({})).content[0].text;
    expect(text).toContain(CORE_INVARIANTS);
  });

  it('advertises every guidance topic in the topic map', async () => {
    const text = (await tool({})).content[0].text;
    for (const topic of GUIDANCE_TOPICS) {
      expect(text).toContain(topic);
    }
  });

  it('does not dump the full legacy prose (no fiction leaks)', async () => {
    const text = (await tool({})).content[0].text;
    expect(text).not.toContain('entry_action');
    expect(text).not.toContain('maximum of 5');
  });
});
