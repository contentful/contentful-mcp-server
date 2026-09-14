import fs from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getAssetUrls,
  getDownloadPath,
  assertAssetDownloadPathsContained,
  downloadAssetsSafely,
} from './assetDownloads.js';

function assetWithUrl(url: string, id = 'asset-id') {
  return {
    sys: { id },
    fields: { file: { 'en-US': { url } } },
  };
}

describe('getAssetUrls', () => {
  it('extracts the url from every locale of every asset', () => {
    const assets = [
      {
        fields: {
          file: {
            'en-US': { url: 'https://a.example.com/one.txt' },
            'de-DE': { url: 'https://a.example.com/eins.txt' },
          },
        },
      },
      assetWithUrl('https://a.example.com/two.txt'),
    ];

    expect(getAssetUrls(assets)).toEqual([
      'https://a.example.com/one.txt',
      'https://a.example.com/eins.txt',
      'https://a.example.com/two.txt',
    ]);
  });

  it('skips assets with no fields, no file map, or a non-string url', () => {
    const assets = [
      {},
      { fields: {} },
      { fields: { file: { 'en-US': {} } } },
      { fields: { file: { 'en-US': { url: 42 } } } },
      assetWithUrl('https://a.example.com/kept.txt'),
    ];

    expect(getAssetUrls(assets)).toEqual(['https://a.example.com/kept.txt']);
  });

  it('returns an empty array for an empty asset list', () => {
    expect(getAssetUrls([])).toEqual([]);
  });
});

describe('getDownloadPath', () => {
  it('joins the export directory with the URL host and decoded pathname', () => {
    expect(
      getDownloadPath('/export', 'https://images.ctfassets.net/space/file.png'),
    ).toBe(join('/export', 'images.ctfassets.net', '/space/file.png'));
  });

  it('decodes percent-encoded pathname segments', () => {
    expect(
      getDownloadPath('/export', 'https://a.example.com/my%20file.png'),
    ).toBe(join('/export', 'a.example.com', '/my file.png'));
  });

  it('treats a protocol-relative URL as https', () => {
    expect(getDownloadPath('/export', '//a.example.com/file.png')).toBe(
      join('/export', 'a.example.com', '/file.png'),
    );
  });

  it('decodes an encoded traversal sequence in the pathname rather than blocking it', () => {
    // Decoding happens here; containment is enforced separately by
    // assertAssetDownloadPathsContained.
    expect(
      getDownloadPath(
        '/export',
        'https://a.example.com/..%2F..%2Foutside.txt',
      ),
    ).toBe(join('/export', 'a.example.com', '../../outside.txt'));
  });
});

describe('assertAssetDownloadPathsContained', () => {
  it('does not throw when every asset URL resolves beneath the export directory', () => {
    expect(() =>
      assertAssetDownloadPathsContained('/export', [
        assetWithUrl('https://a.example.com/safe.txt'),
      ]),
    ).not.toThrow();
  });

  it('does not throw for an asset list with no urls', () => {
    expect(() =>
      assertAssetDownloadPathsContained('/export', [{}, {}]),
    ).not.toThrow();
  });

  it('throws when a url encodes a traversal sequence that escapes the export directory', () => {
    expect(() =>
      assertAssetDownloadPathsContained('/export', [
        assetWithUrl('https://a.example.com/..%2F..%2F..%2Foutside.txt'),
      ]),
    ).toThrow('Asset download path escapes the export directory');
  });

  it('throws on the first unsafe url even when earlier urls are safe', () => {
    expect(() =>
      assertAssetDownloadPathsContained('/export', [
        assetWithUrl('https://a.example.com/safe.txt', 'safe-asset'),
        assetWithUrl(
          'https://a.example.com/..%2F..%2Foutside.txt',
          'unsafe-asset',
        ),
      ]),
    ).toThrow('Asset download path escapes the export directory');
  });

  it('resolves the export directory before checking containment, so a relative exportDir is not itself a bypass', () => {
    expect(() =>
      assertAssetDownloadPathsContained('export', [
        assetWithUrl('https://a.example.com/..%2F..%2Foutside.txt'),
      ]),
    ).toThrow('Asset download path escapes the export directory');
  });
});

describe('downloadAssetsSafely', () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(
      temporaryDirectories
        .splice(0)
        .map((directory) => rm(directory, { recursive: true, force: true })),
    );
  });

  it('rejects an unsafe asset list before doing any filesystem or network work', async () => {
    const mkdirSpy = vi.spyOn(fs.promises, 'mkdir');
    const createWriteStreamSpy = vi.spyOn(fs, 'createWriteStream');

    await expect(
      downloadAssetsSafely(
        { exportDir: '/export', spaceId: 'space', managementToken: 'token' },
        [assetWithUrl('https://a.example.com/..%2F..%2Foutside.txt')],
      ),
    ).rejects.toThrow('Asset download path escapes the export directory');

    expect(mkdirSpy).not.toHaveBeenCalled();
    expect(createWriteStreamSpy).not.toHaveBeenCalled();
  });

  // A single end-to-end smoke test exercising the real contentful-export
  // download task, to catch integration breaks (option shape, task wiring)
  // that the unit tests above can't see.
  it('downloads a safe asset URL to the expected path on disk', async () => {
    const temporaryDirectory = await mkdtemp(
      join(tmpdir(), 'contentful-mcp-asset-download-'),
    );
    temporaryDirectories.push(temporaryDirectory);

    const exportDir = join(temporaryDirectory, 'export');
    const server = createServer((_request, response) => {
      response.end('safe asset');
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');

    try {
      const { port } = server.address() as AddressInfo;
      const host = `127.0.0.1:${port}`;

      await downloadAssetsSafely(
        { exportDir, spaceId: 'example-space', managementToken: 'example-token' },
        [assetWithUrl(`http://${host}/assets/safe.txt`, 'safe-asset')],
      );

      await expect(
        readFile(join(exportDir, host, 'assets', 'safe.txt'), 'utf8'),
      ).resolves.toBe('safe asset');
    } finally {
      server.close();
      await once(server, 'close');
    }
  });
});
