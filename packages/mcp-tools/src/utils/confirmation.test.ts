import { describe, it, expect } from 'vitest';
import {
  buildConfirmToken,
  buildConfirmationPreview,
  CONFIRMATION_MESSAGE_PREFIX,
} from './confirmation.js';

describe('buildConfirmToken', () => {
  it('produces a stable 16-char hex fingerprint for a given (resource, id, version)', () => {
    const token = buildConfirmToken('entry', 'abc123', 7);
    expect(token).toMatch(/^[0-9a-f]{16}$/);
    expect(buildConfirmToken('entry', 'abc123', 7)).toBe(token);
  });

  it('changes when the version changes', () => {
    expect(buildConfirmToken('entry', 'abc123', 7)).not.toBe(
      buildConfirmToken('entry', 'abc123', 8),
    );
  });

  it('changes when the resource type changes', () => {
    expect(buildConfirmToken('entry', 'abc123', 1)).not.toBe(
      buildConfirmToken('contentType', 'abc123', 1),
    );
  });

  it('still produces a stable hex token when version is undefined', () => {
    const token = buildConfirmToken('environment', 'staging');
    expect(token).toMatch(/^[0-9a-f]{16}$/);
    expect(token).toBe(buildConfirmToken('environment', 'staging'));
  });
});

describe('buildConfirmationPreview', () => {
  it('returns preview, confirmToken, and instructions referencing the resource', () => {
    const result = buildConfirmationPreview(
      'entry',
      'abc123',
      { entry: { sys: { id: 'abc123' } } },
      'deadbeefdeadbeef',
    );
    expect(result.confirmToken).toBe('deadbeefdeadbeef');
    expect(result.preview).toEqual({ entry: { sys: { id: 'abc123' } } });
    expect(result.instructions).toContain('entry');
    expect(result.instructions).toContain('abc123');
    expect(result.instructions).toContain('deadbeefdeadbeef');
    expect(result.instructions).toContain('confirm: true');
  });

  it('exposes a stable message prefix for callers to use as the response message', () => {
    expect(CONFIRMATION_MESSAGE_PREFIX).toBe('Confirmation required to delete');
  });

  it('renders multi-word resource names with spaces in instructions', () => {
    const ct = buildConfirmationPreview('contentType', 'BlogPost', {}, 'token');
    expect(ct.instructions).toContain('delete content type "BlogPost"');
    expect(ct.instructions).not.toContain('contentType');

    const cs = buildConfirmationPreview('conceptScheme', 'Topics', {}, 'token');
    expect(cs.instructions).toContain('delete concept scheme "Topics"');
    expect(cs.instructions).not.toContain('conceptScheme');

    const ai = buildConfirmationPreview('aiAction', 'Translate', {}, 'token');
    expect(ai.instructions).toContain('delete AI action "Translate"');
    expect(ai.instructions).not.toContain('aiAction');
  });
});
