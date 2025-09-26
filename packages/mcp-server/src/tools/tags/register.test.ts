import { describe, it, expect, vi } from 'vitest';
import { registerTagsTools } from './register.js';
import { ListTagsToolParams } from './listTags.js';
import { CreateTagToolParams } from './createTag.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('registerTagsTools', () => {
  it('should register all tag tools', () => {
    const mockServer = {
      tool: vi.fn(),
    };

    registerTagsTools(mockServer as unknown as McpServer);

    expect(mockServer.tool).toHaveBeenCalledWith(
      'list_tags',
      'List all tags in a space. Returns all tags that exist in a given environment.',
      ListTagsToolParams.shape,
      expect.any(Function),
    );

    expect(mockServer.tool).toHaveBeenCalledWith(
      'create_tag',
      'Creates a new tag and returns it. Both name and ID must be unique to each environment. Tag names can be modified after creation, but the tag ID cannot. The tag visibility can be set to public or private, defaulting to private if not specified.',
      CreateTagToolParams.shape,
      expect.any(Function),
    );

    expect(mockServer.tool).toHaveBeenCalledTimes(2);
  });
});
