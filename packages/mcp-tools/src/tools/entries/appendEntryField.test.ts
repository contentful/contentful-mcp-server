import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appendEntryFieldTool } from './appendEntryField.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockEntryGet,
  mockEntryUpdate,
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

describe('appendEntryField', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    vi.clearAllMocks();
    setupMockClient();
  });

  // ── Test 1: append to an existing array ──────────────────────────────────
  it('appends new items to an existing array field', async () => {
    const existingLink = { sys: { type: 'Link' as const, linkType: 'Entry' as const, id: 'existing-ref-id' } };
    const newLink = { sys: { type: 'Link' as const, linkType: 'Entry' as const, id: 'new-ref-id' } };

    const mockExistingEntry = {
      ...mockEntry,
      fields: {
        references: { 'en-US': [existingLink] },
      },
    };

    const mockUpdatedEntry = {
      ...mockExistingEntry,
      sys: { ...mockExistingEntry.sys, version: 2 },
      fields: {
        references: { 'en-US': [existingLink, newLink] },
      },
    };

    mockEntryGet.mockResolvedValue(mockExistingEntry);
    mockEntryUpdate.mockResolvedValue(mockUpdatedEntry);

    const tool = appendEntryFieldTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      entryId: 'test-entry-id',
      fieldId: 'references',
      locale: 'en-US',
      values: [newLink],
    });

    expect(mockEntryUpdate).toHaveBeenCalledWith(
      { spaceId: 'test-space-id', environmentId: 'test-environment', entryId: 'test-entry-id' },
      expect.objectContaining({
        fields: expect.objectContaining({
          references: { 'en-US': [existingLink, newLink] },
        }),
      }),
    );

    const expectedResponse = formatResponse('Entry field appended successfully', {
      updatedEntry: mockUpdatedEntry,
      appended: [newLink],
      skipped: [],
      newLength: 2,
    });
    expect(result).toEqual({ content: [{ type: 'text', text: expectedResponse }] });
  });

  // ── Test 2: initialize absent field/locale ───────────────────────────────
  it('initializes a missing field/locale as an empty array and appends to it', async () => {
    const newSymbol = 'tag-alpha';

    const mockExistingEntry = {
      ...mockEntry,
      fields: {
        title: { 'en-US': 'My Entry' },
        // tags field does not exist at all
      },
    };

    const mockUpdatedEntry = {
      ...mockExistingEntry,
      sys: { ...mockExistingEntry.sys, version: 2 },
      fields: {
        title: { 'en-US': 'My Entry' },
        tags: { 'en-US': [newSymbol] },
      },
    };

    mockEntryGet.mockResolvedValue(mockExistingEntry);
    mockEntryUpdate.mockResolvedValue(mockUpdatedEntry);

    const tool = appendEntryFieldTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      entryId: 'test-entry-id',
      fieldId: 'tags',
      locale: 'en-US',
      values: [newSymbol],
    });

    expect(mockEntryUpdate).toHaveBeenCalledWith(
      { spaceId: 'test-space-id', environmentId: 'test-environment', entryId: 'test-entry-id' },
      expect.objectContaining({
        fields: expect.objectContaining({
          tags: { 'en-US': [newSymbol] },
        }),
      }),
    );

    const expectedResponse = formatResponse('Entry field appended successfully', {
      updatedEntry: mockUpdatedEntry,
      appended: [newSymbol],
      skipped: [],
      newLength: 1,
    });
    expect(result).toEqual({ content: [{ type: 'text', text: expectedResponse }] });
  });

  // ── Test 3: dedupe skips items already present ───────────────────────────
  it('skips items that are already present in the array (dedupe by sys.id)', async () => {
    const existingLink = { sys: { type: 'Link' as const, linkType: 'Entry' as const, id: 'already-here' } };
    const newLink = { sys: { type: 'Link' as const, linkType: 'Entry' as const, id: 'brand-new' } };

    const mockExistingEntry = {
      ...mockEntry,
      fields: {
        references: { 'en-US': [existingLink] },
      },
    };

    // After the call the array has only two items: the existing one + brand-new
    const mockUpdatedEntry = {
      ...mockExistingEntry,
      sys: { ...mockExistingEntry.sys, version: 2 },
      fields: {
        references: { 'en-US': [existingLink, newLink] },
      },
    };

    mockEntryGet.mockResolvedValue(mockExistingEntry);
    mockEntryUpdate.mockResolvedValue(mockUpdatedEntry);

    const tool = appendEntryFieldTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      entryId: 'test-entry-id',
      fieldId: 'references',
      locale: 'en-US',
      values: [existingLink, newLink], // existingLink is a duplicate
    });

    // update must have been called with the de-duped array only
    expect(mockEntryUpdate).toHaveBeenCalledWith(
      { spaceId: 'test-space-id', environmentId: 'test-environment', entryId: 'test-entry-id' },
      expect.objectContaining({
        fields: expect.objectContaining({
          references: { 'en-US': [existingLink, newLink] },
        }),
      }),
    );

    const expectedResponse = formatResponse('Entry field appended successfully', {
      updatedEntry: mockUpdatedEntry,
      appended: [newLink],
      skipped: [existingLink],
      newLength: 2,
    });
    expect(result).toEqual({ content: [{ type: 'text', text: expectedResponse }] });
  });

  // ── Test 4: dedupe for ResourceLinks by sys.urn ──────────────────────────
  it('skips ResourceLink items that are already present (dedupe by sys.urn)', async () => {
    const existingRL = {
      sys: { type: 'ResourceLink' as const, linkType: 'Contentful:Entry', urn: 'crn:contentful:::content/spaces/s/entries/already-rl' },
    };
    const newRL = {
      sys: { type: 'ResourceLink' as const, linkType: 'Contentful:Entry', urn: 'crn:contentful:::content/spaces/s/entries/new-rl' },
    };

    const mockExistingEntry = {
      ...mockEntry,
      fields: { crossSpaceRefs: { 'en-US': [existingRL] } },
    };
    const mockUpdatedEntry = {
      ...mockExistingEntry,
      sys: { ...mockExistingEntry.sys, version: 2 },
      fields: { crossSpaceRefs: { 'en-US': [existingRL, newRL] } },
    };

    mockEntryGet.mockResolvedValue(mockExistingEntry);
    mockEntryUpdate.mockResolvedValue(mockUpdatedEntry);

    const tool = appendEntryFieldTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      entryId: 'test-entry-id',
      fieldId: 'crossSpaceRefs',
      locale: 'en-US',
      values: [existingRL, newRL],
    });

    const expectedResponse = formatResponse('Entry field appended successfully', {
      updatedEntry: mockUpdatedEntry,
      appended: [newRL],
      skipped: [existingRL],
      newLength: 2,
    });
    expect(result).toEqual({ content: [{ type: 'text', text: expectedResponse }] });
  });

  // ── Test 5: version conflict when a stale version is passed ─────────────
  it('returns a version conflict error when the supplied version is stale', async () => {
    const mockExistingEntry = {
      ...mockEntry,
      sys: { ...mockEntry.sys, version: 5 }, // server is at v5
      fields: { tags: { 'en-US': ['existing-tag'] } },
    };

    mockEntryGet.mockResolvedValue(mockExistingEntry);

    const tool = appendEntryFieldTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      entryId: 'test-entry-id',
      fieldId: 'tags',
      locale: 'en-US',
      values: ['new-tag'],
      version: 2, // caller read at v2, server is now v5
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error appending entry field: Version conflict: the entry has changed since you read it (your version: 2, current version: 5). Re-fetch the entry with get_entry and retry with the latest version.',
        },
      ],
    });
    expect(mockEntryUpdate).not.toHaveBeenCalled();
  });

  // ── Test 6: non-array field error ────────────────────────────────────────
  it('returns an error when the target field/locale is not an array', async () => {
    const mockExistingEntry = {
      ...mockEntry,
      fields: {
        title: { 'en-US': 'A plain string, not an array' },
      },
    };

    mockEntryGet.mockResolvedValue(mockExistingEntry);

    const tool = appendEntryFieldTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      entryId: 'test-entry-id',
      fieldId: 'title',
      locale: 'en-US',
      values: ['oops'],
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error appending entry field: Field "title" locale "en-US" is not an array (got string). append_entry_field only works on Array of Symbols, Array of Links, and Array of ResourceLinks fields.',
        },
      ],
    });
    expect(mockEntryUpdate).not.toHaveBeenCalled();
  });

  // ── Test 7: multi-locale isolation ──────────────────────────────────────
  it('leaves other locales within the same field untouched', async () => {
    const existingLink = { sys: { type: 'Link' as const, linkType: 'Entry' as const, id: 'existing-ref' } };
    const newLink = { sys: { type: 'Link' as const, linkType: 'Entry' as const, id: 'new-ref' } };
    const deLocaleLink = { sys: { type: 'Link' as const, linkType: 'Entry' as const, id: 'de-locale-ref' } };

    const mockExistingEntry = {
      ...mockEntry,
      fields: {
        references: {
          'en-US': [existingLink],
          de: [deLocaleLink],        // German locale — must remain untouched
        },
      },
    };

    const mockUpdatedEntry = {
      ...mockExistingEntry,
      sys: { ...mockExistingEntry.sys, version: 2 },
      fields: {
        references: {
          'en-US': [existingLink, newLink], // only en-US changed
          de: [deLocaleLink],               // de unchanged
        },
      },
    };

    mockEntryGet.mockResolvedValue(mockExistingEntry);
    mockEntryUpdate.mockResolvedValue(mockUpdatedEntry);

    const tool = appendEntryFieldTool(mockConfig);
    await tool({
      ...mockArgs,
      entryId: 'test-entry-id',
      fieldId: 'references',
      locale: 'en-US',
      values: [newLink],
    });

    expect(mockEntryUpdate).toHaveBeenCalledWith(
      { spaceId: 'test-space-id', environmentId: 'test-environment', entryId: 'test-entry-id' },
      expect.objectContaining({
        fields: expect.objectContaining({
          references: {
            'en-US': [existingLink, newLink],
            de: [deLocaleLink], // untouched
          },
        }),
      }),
    );
  });

  // ── Test 8: protected environment ───────────────────────────────────────
  it('returns an error when the environment is protected', async () => {
    const protectedConfig = createMockConfig({ protectedEnvironments: ['master'] });
    const tool = appendEntryFieldTool(protectedConfig);

    const result = await tool({
      ...mockArgs,
      environmentId: 'master',
      entryId: 'test-entry-id',
      fieldId: 'tags',
      locale: 'en-US',
      values: ['new-tag'],
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error appending entry field: Environment 'master' is protected. Write and delete operations are not allowed.",
        },
      ],
    });
    expect(mockEntryUpdate).not.toHaveBeenCalled();
  });

  // ── Test 9: no version passed → appends without conflict check ───────────
  it('appends successfully when no version is supplied (no conflict check)', async () => {
    const existingSymbol = 'tag-existing';
    const newSymbol = 'tag-new';

    const mockExistingEntry = {
      ...mockEntry,
      sys: { ...mockEntry.sys, version: 7 }, // any version — no check expected
      fields: { tags: { 'en-US': [existingSymbol] } },
    };

    const mockUpdatedEntry = {
      ...mockExistingEntry,
      sys: { ...mockExistingEntry.sys, version: 8 },
      fields: { tags: { 'en-US': [existingSymbol, newSymbol] } },
    };

    mockEntryGet.mockResolvedValue(mockExistingEntry);
    mockEntryUpdate.mockResolvedValue(mockUpdatedEntry);

    const tool = appendEntryFieldTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      entryId: 'test-entry-id',
      fieldId: 'tags',
      locale: 'en-US',
      values: [newSymbol],
      // version intentionally omitted
    });

    expect(mockEntryUpdate).toHaveBeenCalled();
    expect(result).not.toHaveProperty('isError');
  });
});
