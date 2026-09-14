import fs from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { once } from 'node:events';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { downloadAssetsSafely } from './assetDownloads.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('asset downloads', () => {
  it('downloads safe asset URLs beneath the export directory', async () => {
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
        {
          exportDir,
          spaceId: 'example-space',
          managementToken: 'example-token',
        },
        [
          {
            sys: { id: 'safe-asset' },
            fields: {
              file: {
                'en-US': {
                  url: `http://${host}/assets/safe.txt`,
                },
              },
            },
          },
        ],
      );

      await expect(
        readFile(join(exportDir, host, 'assets', 'safe.txt'), 'utf8'),
      ).resolves.toBe('safe asset');
    } finally {
      server.close();
      await once(server, 'close');
    }
  });

  it('rejects encoded traversal before creating a directory or write stream', async () => {
    const temporaryDirectory = await mkdtemp(
      join(tmpdir(), 'contentful-mcp-asset-download-'),
    );
    temporaryDirectories.push(temporaryDirectory);

    const exportDir = join(temporaryDirectory, 'safe', 'export');
    await mkdir(exportDir, { recursive: true });
    const outsidePath = join(temporaryDirectory, 'outside.txt');
    const originalMkdir = fs.promises.mkdir.bind(fs.promises);
    const attemptedDirectories: string[] = [];

    vi.spyOn(fs.promises, 'mkdir').mockImplementation(async (path, options) => {
      const attemptedDirectory = resolve(path.toString());
      attemptedDirectories.push(attemptedDirectory);

      const relativePath = relative(exportDir, attemptedDirectory);
      if (relativePath.startsWith('..')) {
        throw new Error('Test blocked an outside directory write');
      }

      return originalMkdir(path, options);
    });
    const createWriteStream = vi.spyOn(fs, 'createWriteStream');

    await expect(
      downloadAssetsSafely(
        {
          exportDir,
          spaceId: 'example-space',
          managementToken: 'example-token',
        },
        [
          {
            sys: { id: 'safe-asset' },
            fields: {
              file: {
                'en-US': {
                  url: 'https://assets.example.com/safe.txt',
                },
              },
            },
          },
          {
            sys: { id: 'unsafe-asset' },
            fields: {
              file: {
                'en-US': {
                  url: 'https://assets.example.com/..%2F..%2F..%2Foutside.txt',
                },
              },
            },
          },
        ],
      ),
    ).rejects.toThrow('Asset download path escapes the export directory');

    expect(attemptedDirectories).toEqual([]);
    expect(createWriteStream).not.toHaveBeenCalled();
    expect(fs.existsSync(outsidePath)).toBe(false);
  });
});
