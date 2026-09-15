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
  downloadAsset,
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

describe('downloadAsset', () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    vi.unstubAllGlobals();
    await Promise.all(
      temporaryDirectories
        .splice(0)
        .map((directory) => rm(directory, { recursive: true, force: true })),
    );
  });

  async function withTempExportDir(): Promise<string> {
    const temporaryDirectory = await mkdtemp(
      join(tmpdir(), 'contentful-mcp-asset-download-'),
    );
    temporaryDirectories.push(temporaryDirectory);
    return join(temporaryDirectory, 'export');
  }

  it('writes the response body to the computed download path, creating directories as needed', async () => {
    const exportDir = await withTempExportDir();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      arrayBuffer: async () => Buffer.from('safe asset'),
    });
    vi.stubGlobal('fetch', fetchMock);

    const destination = await downloadAsset(
      exportDir,
      'https://a.example.com/nested/safe.txt',
    );

    expect(destination).toBe(
      join(exportDir, 'a.example.com', 'nested', 'safe.txt'),
    );
    await expect(readFile(destination, 'utf8')).resolves.toBe('safe asset');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://a.example.com/nested/safe.txt',
    );
  });

  it('normalizes a protocol-relative URL to https before fetching', async () => {
    const exportDir = await withTempExportDir();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      arrayBuffer: async () => Buffer.from('safe asset'),
    });
    vi.stubGlobal('fetch', fetchMock);

    await downloadAsset(exportDir, '//a.example.com/safe.txt');

    expect(fetchMock).toHaveBeenCalledWith('https://a.example.com/safe.txt');
  });

  it('throws, without writing anything, when the response is not ok', async () => {
    const exportDir = await withTempExportDir();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      arrayBuffer: async () => Buffer.from(''),
    });
    vi.stubGlobal('fetch', fetchMock);
    const mkdirSpy = vi.spyOn(fs.promises, 'mkdir');

    await expect(
      downloadAsset(exportDir, 'https://a.example.com/missing.txt'),
    ).rejects.toThrow(/404/);

    expect(mkdirSpy).not.toHaveBeenCalled();
  });

  it('propagates a network-level fetch failure', async () => {
    const exportDir = await withTempExportDir();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network down')),
    );

    await expect(
      downloadAsset(exportDir, 'https://a.example.com/safe.txt'),
    ).rejects.toThrow('network down');
  });
});

describe('downloadAssetsSafely', () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    await Promise.all(
      temporaryDirectories
        .splice(0)
        .map((directory) => rm(directory, { recursive: true, force: true })),
    );
  });

  it('rejects an unsafe asset list before doing any filesystem or network work', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const mkdirSpy = vi.spyOn(fs.promises, 'mkdir');

    await expect(
      downloadAssetsSafely(
        { exportDir: '/export', spaceId: 'space', managementToken: 'token' },
        [assetWithUrl('https://a.example.com/..%2F..%2Foutside.txt')],
      ),
    ).rejects.toThrow('Asset download path escapes the export directory');

    expect(mkdirSpy).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('downloads every safe asset URL to its computed path', async () => {
    const temporaryDirectory = await mkdtemp(
      join(tmpdir(), 'contentful-mcp-asset-download-'),
    );
    temporaryDirectories.push(temporaryDirectory);
    const exportDir = join(temporaryDirectory, 'export');

    const bodies: Record<string, string> = {
      'https://a.example.com/one.txt': 'one',
      'https://a.example.com/two.txt': 'two',
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        arrayBuffer: async () => Buffer.from(bodies[url]),
      })),
    );

    await downloadAssetsSafely(
      { exportDir, spaceId: 'example-space', managementToken: 'example-token' },
      [
        assetWithUrl('https://a.example.com/one.txt', 'asset-one'),
        assetWithUrl('https://a.example.com/two.txt', 'asset-two'),
      ],
    );

    await expect(
      readFile(join(exportDir, 'a.example.com', 'one.txt'), 'utf8'),
    ).resolves.toBe('one');
    await expect(
      readFile(join(exportDir, 'a.example.com', 'two.txt'), 'utf8'),
    ).resolves.toBe('two');
  });

  it('propagates a download failure for one asset without swallowing it', async () => {
    const temporaryDirectory = await mkdtemp(
      join(tmpdir(), 'contentful-mcp-asset-download-'),
    );
    temporaryDirectories.push(temporaryDirectory);
    const exportDir = join(temporaryDirectory, 'export');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        arrayBuffer: async () => Buffer.from(''),
      }),
    );

    await expect(
      downloadAssetsSafely(
        { exportDir, spaceId: 'example-space', managementToken: 'example-token' },
        [assetWithUrl('https://a.example.com/broken.txt')],
      ),
    ).rejects.toThrow(/500/);
  });

  // A single end-to-end smoke test against a real HTTP server, to catch
  // integration breaks (fetch usage, path handling) that the mocked-fetch
  // unit tests above can't see.
  it('downloads a safe asset URL from a real server to the expected path on disk', async () => {
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
