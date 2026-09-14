import { isAbsolute, join, relative, resolve, sep } from 'node:path';

// @ts-expect-error contentful-export does not publish types for its internal download task.
import createDownloadAssetsTask from 'contentful-export/dist/tasks/download-assets.js';
// @ts-expect-error contentful-export does not publish types for its option parser.
import parseExportOptions from 'contentful-export/dist/parseOptions.js';

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

export async function downloadAssetsSafely(
  options: AssetDownloadOptions,
  assets: unknown[],
): Promise<void> {
  assertAssetDownloadPathsContained(options.exportDir, assets);

  const parsedOptions = parseExportOptions(options);
  const downloadAssets = createDownloadAssetsTask(parsedOptions);
  await downloadAssets({ data: { assets } }, { output: '' });
}
