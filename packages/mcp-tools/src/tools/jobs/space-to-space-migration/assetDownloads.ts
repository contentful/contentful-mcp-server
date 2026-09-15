import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

export interface AssetDownloadOptions {
  exportDir: string;
  [key: string]: unknown;
}

interface ExportedAsset {
  fields?: {
    file?: Record<string, { url?: unknown } | undefined>;
  };
}

export function getAssetUrls(assets: unknown[]): string[] {
  return assets.flatMap((asset) => {
    const files = (asset as ExportedAsset).fields?.file;
    if (!files) {
      return [];
    }

    return Object.values(files).flatMap((file) =>
      typeof file?.url === 'string' ? [file.url] : [],
    );
  });
}

export function getDownloadPath(exportDir: string, url: string): string {
  const parsedUrl = new URL(url.startsWith('//') ? `https:${url}` : url);
  const decodedPathname = decodeURIComponent(parsedUrl.pathname);
  return join(exportDir, parsedUrl.host, decodedPathname);
}

export function assertAssetDownloadPathsContained(
  exportDir: string,
  assets: unknown[],
): void {
  const resolvedExportDir = resolve(exportDir);

  for (const url of getAssetUrls(assets)) {
    const downloadPath = resolve(getDownloadPath(resolvedExportDir, url));
    const relativePath = relative(resolvedExportDir, downloadPath);

    if (
      relativePath === '..' ||
      relativePath.startsWith(`..${sep}`) ||
      isAbsolute(relativePath)
    ) {
      throw new Error('Asset download path escapes the export directory');
    }
  }
}

/**
 * Downloads a single asset URL to its computed path beneath exportDir.
 * Deliberately basic: no retries, no timeout override, no embargoed-asset
 * URL signing. Contentful-export's own download task provides those; this
 * exists only until it exposes a public entry point we can call instead of
 * reaching into its dist/ internals.
 */
export async function downloadAsset(
  exportDir: string,
  url: string,
): Promise<string> {
  const destination = getDownloadPath(exportDir, url);
  const requestUrl = url.startsWith('//') ? `https:${url}` : url;

  const response = await fetch(requestUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to download asset from ${requestUrl}: ${response.status} ${response.statusText}`,
    );
  }

  const body = Buffer.from(await response.arrayBuffer());
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, body);

  return destination;
}

export async function downloadAssetsSafely(
  options: AssetDownloadOptions,
  assets: unknown[],
): Promise<void> {
  assertAssetDownloadPathsContained(options.exportDir, assets);

  for (const url of getAssetUrls(assets)) {
    await downloadAsset(options.exportDir, url);
  }
}
