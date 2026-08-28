import { describe, it, expect } from 'vitest';
import { createContentPreviewTools } from './register.js';
import { ListContentPreviewsToolParams } from './listContentPreviews.js';
import { GetEntryPreviewUrlToolParams } from './getEntryPreviewUrl.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('content preview tools collection', () => {
  const mockConfig = createMockConfig();

  it('should export createContentPreviewTools factory function', () => {
    expect(createContentPreviewTools).toBeDefined();
    expect(typeof createContentPreviewTools).toBe('function');
  });

  it('should create contentPreviewTools collection with correct structure', () => {
    const tools = createContentPreviewTools(mockConfig);
    expect(Object.keys(tools)).toHaveLength(2);
  });

  it('should have listContentPreviews tool with correct properties', () => {
    const { listContentPreviews } = createContentPreviewTools(mockConfig);

    expect(listContentPreviews.title).toBe('list_content_previews');
    expect(listContentPreviews.inputParams).toStrictEqual(
      ListContentPreviewsToolParams.shape,
    );
    expect(listContentPreviews.annotations).toEqual({
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    });
    expect(typeof listContentPreviews.tool).toBe('function');
  });

  it('should have getEntryPreviewUrl tool with correct properties', () => {
    const { getEntryPreviewUrl } = createContentPreviewTools(mockConfig);

    expect(getEntryPreviewUrl.title).toBe('get_entry_preview_url');
    expect(getEntryPreviewUrl.inputParams).toStrictEqual(
      GetEntryPreviewUrlToolParams.shape,
    );
    expect(getEntryPreviewUrl.annotations).toEqual({
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    });
    expect(typeof getEntryPreviewUrl.tool).toBe('function');
  });
});
