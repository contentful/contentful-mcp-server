import { describe, it, expect } from 'vitest';
import { tagTools } from './register.js';
import { listTagsTool, ListTagsToolParams } from './listTags.js';
import { createTagTool, CreateTagToolParams } from './createTag.js';

describe('tag tools collection', () => {
  it('should export tagTools collection with correct structure', () => {
    expect(tagTools).toBeDefined();
    expect(Object.keys(tagTools)).toHaveLength(2);
  });

  it('should have listTags tool with correct properties', () => {
    const { listTags } = tagTools;

    expect(listTags.title).toBe('list_tags');
    expect(listTags.description).toBe(
      'List all tags in a space. Returns all tags that exist in a given environment.',
    );
    expect(listTags.inputParams).toStrictEqual(ListTagsToolParams.shape);
    expect(listTags.annotations).toEqual({
      readOnlyHint: true,
      openWorldHint: false,
    });
    expect(listTags.tool).toBe(listTagsTool);
  });

  it('should have createTag tool with correct properties', () => {
    const { createTag } = tagTools;

    expect(createTag.title).toBe('create_tag');
    expect(createTag.description).toBe(
      'Creates a new tag and returns it. Both name and ID must be unique to each environment. Tag names can be modified after creation, but the tag ID cannot. The tag visibility can be set to public or private, defaulting to private if not specified.',
    );
    expect(createTag.inputParams).toStrictEqual(CreateTagToolParams.shape);
    expect(createTag.annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    });
    expect(createTag.tool).toBe(createTagTool);
  });
});
