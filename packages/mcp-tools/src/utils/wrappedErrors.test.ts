import { beforeAll, describe, expect, it, vi } from 'vitest';

import { publishAiActionTool } from '../tools/ai-actions/publishAiAction.js';
import { unpublishAiActionTool } from '../tools/ai-actions/unpublishAiAction.js';
import { archiveAssetTool } from '../tools/assets/archiveAsset.js';
import { publishAssetTool } from '../tools/assets/publishAsset.js';
import { unarchiveAssetTool } from '../tools/assets/unarchiveAsset.js';
import { unpublishAssetTool } from '../tools/assets/unpublishAsset.js';
import { archiveEntryTool } from '../tools/entries/archiveEntry.js';
import { unarchiveEntryTool } from '../tools/entries/unarchiveEntry.js';
import {
  createExportSpaceTool,
  ExportSpaceToolParams,
} from '../tools/jobs/space-to-space-migration/exportSpace.js';
import {
  createImportSpaceTool,
  ImportSpaceToolParams,
} from '../tools/jobs/space-to-space-migration/importSpace.js';
import { createMockConfig } from '../test-helpers/mockConfig.js';
import { createSdkError } from '../test-helpers/sdkError.js';
import { createToolClient } from './tools.js';

vi.mock('./tools.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./tools.js')>()),
  createToolClient: vi.fn(),
}));

const { mockExport, mockImport } = vi.hoisted(() => ({
  mockExport: vi.fn(),
  mockImport: vi.fn(),
}));
vi.mock('contentful-export', () => ({ default: mockExport }));
vi.mock('contentful-import', () => ({ default: mockImport }));

const config = createMockConfig({ host: 'contentful.invalid' });
const baseParams = { spaceId: 'test-space', environmentId: 'test-environment' };
let error: Error;
beforeAll(async () => {
  error = await createSdkError();
});

function expectSanitizedDiagnostics(text: string) {
  expect(text).toContain('Validation failed');
  expect(text).not.toMatch(/ABCDE|synthetic-secret|headers|payloadData/);
}

describe('tools that add error context', () => {
  it.each([
    ['Asset publish', publishAssetTool],
    ['Asset unpublish', unpublishAssetTool],
    ['AI action publish', publishAiActionTool],
    ['AI action unpublish', unpublishAiActionTool],
  ])('%s sanitizes returned SDK errors', async (name, tool) => {
    const reject = vi.fn().mockRejectedValue(error);
    vi.mocked(createToolClient).mockReturnValue({
      asset: { get: reject },
      aiAction: { get: reject, unpublish: reject },
    } as unknown as ReturnType<typeof createToolClient>);

    const response = await tool(config)({
      ...baseParams,
      assetId: 'test-entity',
      aiActionId: 'test-entity',
    });

    expectSanitizedDiagnostics(response.content[0].text);
    expect(response.content[0].text).toContain(`${name} failed:`);
  });

  it.each([
    ['archive entry', archiveEntryTool, 'archiving'],
    ['unarchive entry', unarchiveEntryTool, 'unarchiving'],
    ['archive asset', archiveAssetTool, 'archiving'],
    ['unarchive asset', unarchiveAssetTool, 'unarchiving'],
  ])(
    '%s preserves partial success without leaking SDK request data',
    async (_name, tool, progress) => {
      const operation = vi
        .fn()
        .mockResolvedValueOnce({})
        .mockRejectedValue(error);
      vi.mocked(createToolClient).mockReturnValue({
        entry: { archive: operation, unarchive: operation },
        asset: { archive: operation, unarchive: operation },
      } as unknown as ReturnType<typeof createToolClient>);

      const response = await tool(config)({
        ...baseParams,
        entryId: ['completed-id', 'failed-id'],
        assetId: ['completed-id', 'failed-id'],
      });

      expect(response.isError).toBe(true);
      const text = response.content[0].text;
      expect(text).toContain(`successfully ${progress} 1`);
      expect(text).toContain('[completed-id]');
      expect(text).toContain("'failed-id'");
      expectSanitizedDiagnostics(text);
    },
  );

  it.each([
    {
      name: 'export',
      mock: mockExport,
      run: () =>
        createExportSpaceTool(config)(
          ExportSpaceToolParams.parse({ ...baseParams, saveFile: false }),
        ),
    },
    {
      name: 'import',
      mock: mockImport,
      run: () =>
        createImportSpaceTool(config)(
          ImportSpaceToolParams.parse({ ...baseParams, content: {} }),
        ),
    },
  ])(
    '$name preserves migration context without leaking SDK request data',
    async ({ name, mock, run }) => {
      mock.mockRejectedValueOnce(error);

      const response = await run();

      expect(response.isError).toBe(true);
      const text = response.content[0].text;
      expect(text).toContain(`Failed to ${name} space: `);
      expectSanitizedDiagnostics(text);
    },
  );
});
