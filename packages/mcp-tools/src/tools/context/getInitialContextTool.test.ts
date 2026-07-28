import { describe, it, expect } from 'vitest';
import { getInitialContextTool } from './getInitialContextTool.js';
import {
  CORE_INVARIANTS,
  SEARCHING_GUIDANCE,
  CONVENTIONS_GUIDANCE,
  EXO_DISPOSITION,
} from './instructions.js';
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

  it("includes today's date as a session fact", async () => {
    const text = (await tool({})).content[0].text;
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    expect(text).toContain("Today's date:");
    expect(text).toContain(today);
  });

  it('includes the core invariants inline', async () => {
    const text = (await tool({})).content[0].text;
    expect(text).toContain(CORE_INVARIANTS);
  });

  it('includes searching and conventions guidance inline', async () => {
    const text = (await tool({})).content[0].text;
    expect(text).toContain(SEARCHING_GUIDANCE);
    expect(text).toContain(CONVENTIONS_GUIDANCE);
  });

  it('does not dump the full legacy prose (no fiction leaks)', async () => {
    const text = (await tool({})).content[0].text;
    expect(text).not.toContain('entry_action');
    expect(text).not.toContain('maximum of 5');
  });

  it('does not use the legacy envelope format', async () => {
    const text = (await tool({})).content[0].text;
    expect(text).not.toContain('<context>');
    expect(text).not.toContain('<todaysDate>');
    expect(text).not.toContain(
      'This is the initial context for your Contentful instance',
    );
  });

  it('does NOT append the ExO disposition when exoToolsRegistered is unset', async () => {
    const text = (await getInitialContextTool(config)({})).content[0].text;
    expect(text).not.toContain(EXO_DISPOSITION);
  });

  it('appends the ExO disposition when exoToolsRegistered is true', async () => {
    const exoConfig: ContentfulConfig = { ...config, exoToolsRegistered: true };
    const text = (await getInitialContextTool(exoConfig)({})).content[0].text;
    expect(text).toContain(EXO_DISPOSITION);
  });
});
