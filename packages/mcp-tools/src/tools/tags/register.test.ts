import { describe, it, expect } from 'vitest';
import { createTagTools } from './register.js';
import { ListTagsToolParams } from './listTags.js';
import { CreateTagToolParams } from './createTag.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('tag tools collection', () => {
  const mockConfig = createMockConfig();

  it('should export createTagTools factory function', () => {
    expect(createTagTools).toBeDefined();
    expect(typeof createTagTools).toBe('function');
  });

  it('should create tagTools collection with correct structure', () => {
    const tagTools = createTagTools(mockConfig);
    expect(tagTools).toBeDefined();
    expect(Object.keys(tagTools)).toHaveLength(2);
  });

  it('should have listTags tool with correct properties', () => {
    const tagTools = createTagTools(mockConfig);
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
    expect(listTags.tool).toBeDefined();
    expect(typeof listTags.tool).toBe('function');
  });

  it('should have createTag tool with correct properties', () => {
    const tagTools = createTagTools(mockConfig);
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
    expect(createTag.tool).toBeDefined();
    expect(typeof createTag.tool).toBe('function');
  });
});
