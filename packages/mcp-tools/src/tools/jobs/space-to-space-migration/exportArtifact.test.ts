import { describe, expect, it } from 'vitest';
import { createExportArtifact } from './exportArtifact.js';
import { isAbsolute, relative } from 'node:path';

describe('createExportArtifact', () => {
  it('creates unique server-owned paths without caller input', async () => {
    const artifact = await createExportArtifact({
      tmpdir: () => '/tmp',
      randomUUID: () => '11111111-1111-4111-8111-111111111111',
      mkdtemp: async (prefix) => `${prefix}abcdef`,
    });

    expect(artifact.exportDir).toBe(
      '/tmp/contentful-mcp-export-11111111-1111-4111-8111-111111111111-abcdef',
    );
    expect(artifact.contentFile).toBe(
      '11111111-1111-4111-8111-111111111111.json',
    );
    expect(artifact.errorLogFile).toBe(
      '/tmp/contentful-mcp-export-11111111-1111-4111-8111-111111111111-abcdef/11111111-1111-4111-8111-111111111111.error.json',
    );
    expect(artifact.exportPath).toBe(
      '/tmp/contentful-mcp-export-11111111-1111-4111-8111-111111111111-abcdef/11111111-1111-4111-8111-111111111111.json',
    );
  });

  it('uses different directories for different UUIDs', async () => {
    const ids = [
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
    ];

    const first = await createExportArtifact({
      tmpdir: () => '/tmp',
      randomUUID: () => ids[0],
      mkdtemp: async (prefix) => `${prefix}abcdef`,
    });
    const second = await createExportArtifact({
      tmpdir: () => '/tmp',
      randomUUID: () => ids[1],
      mkdtemp: async (prefix) => `${prefix}abcdef`,
    });

    expect(first.exportDir).not.toBe(second.exportDir);
  });

  it('keeps path-valued fields within the generated export directory', async () => {
    const artifact = await createExportArtifact({
      tmpdir: () => '/tmp',
      randomUUID: () => '11111111-1111-4111-8111-111111111111',
      mkdtemp: async (prefix) => `${prefix}abcdef`,
    });

    expect(isAbsolute(artifact.contentFile)).toBe(false);
    expect(relative(artifact.exportDir, artifact.exportPath)).toBe(
      artifact.contentFile,
    );
    expect(relative(artifact.exportDir, artifact.errorLogFile)).toBe(
      '11111111-1111-4111-8111-111111111111.error.json',
    );
  });
});
