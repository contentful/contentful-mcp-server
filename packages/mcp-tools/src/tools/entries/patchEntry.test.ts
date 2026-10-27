import { describe, it, expect, beforeEach, vi } from 'vitest';
import { patchEntryTool, PatchEntryToolParams } from './patchEntry.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockEntryGet,
  mockEntryPatch,
  mockEntry,
  mockArgs,
} from './mockClient.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

vi.mock('../../utils/tools.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../utils/tools.js')>();
  return {
    ...orig,
    createToolClient: vi.fn(),
  };
});

describe('patchEntry', () => {
  const mockConfig = createMockConfig();
  const operations = [
    { op: 'replace' as const, path: '/fields/title/de-DE', value: 'Hallo' },
  ];
  const patchedEntry = {
    ...mockEntry,
    sys: { ...mockEntry.sys, version: 2 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupMockClient();
  });

  it('patches with the supplied version without fetching the entry', async () => {
    mockEntryPatch.mockResolvedValue(patchedEntry);

    const tool = patchEntryTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      entryId: 'test-entry-id',
      version: 5,
      operations,
    });

    expect(mockEntryGet).not.toHaveBeenCalled();
    expect(mockEntryPatch).toHaveBeenCalledWith(
      {
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
        entryId: 'test-entry-id',
        version: 5,
      },
      operations,
    );
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: formatResponse('Entry patched successfully', {
            updatedEntry: patchedEntry,
          }),
        },
      ],
    });
  });

  it('resolves the current version server-side when version is omitted', async () => {
    mockEntryGet.mockResolvedValue({
      ...mockEntry,
      sys: { ...mockEntry.sys, version: 7 },
    });
    mockEntryPatch.mockResolvedValue(patchedEntry);

    const tool = patchEntryTool(mockConfig);
    await tool({ ...mockArgs, entryId: 'test-entry-id', operations });

    expect(mockEntryGet).toHaveBeenCalledTimes(1);
    expect(mockEntryPatch).toHaveBeenCalledWith(
      expect.objectContaining({ version: 7 }),
      operations,
    );
  });

  it('surfaces a version conflict from the CMA', async () => {
    mockEntryPatch.mockRejectedValue(new Error('VersionMismatch'));

    const tool = patchEntryTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      entryId: 'test-entry-id',
      version: 1,
      operations,
    });

    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error patching entry: VersionMismatch' },
      ],
    });
  });

  it('returns an error when the environment is protected', async () => {
    const tool = patchEntryTool(
      createMockConfig({ protectedEnvironments: ['master'] }),
    );
    const result = await tool({
      ...mockArgs,
      environmentId: 'master',
      entryId: 'test-entry-id',
      version: 1,
      operations,
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error patching entry: Environment 'master' is protected. Write and delete operations are not allowed.",
        },
      ],
    });
    expect(mockEntryPatch).not.toHaveBeenCalled();
  });

  describe('operations schema', () => {
    const schema = PatchEntryToolParams.shape.operations;

    it.each(['/fields/title/en-US', '/fields/body/de-DE/content/0'])(
      'accepts field-locale path %s',
      (path) => {
        expect(
          schema.safeParse([{ op: 'replace', path, value: 'x' }]).success,
        ).toBe(true);
      },
    );

    it.each([
      '/sys/version',
      '/metadata/tags',
      '/fields/title',
      '/fields',
      'fields/title/en-US',
    ])('rejects path %s', (path) => {
      expect(
        schema.safeParse([{ op: 'replace', path, value: 'x' }]).success,
      ).toBe(false);
    });

    it('rejects move and copy operations', () => {
      for (const op of ['move', 'copy']) {
        expect(
          schema.safeParse([{ op, path: '/fields/title/en-US' }]).success,
        ).toBe(false);
      }
    });

    it('rejects an empty operations list', () => {
      expect(schema.safeParse([]).success).toBe(false);
    });
  });
});
