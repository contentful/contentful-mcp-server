import { describe, it, expect } from 'vitest';
import { spaceTools } from './register.js';
import { listSpacesTool, ListSpacesToolParams } from './listSpaces.js';
import { getSpaceTool, GetSpaceToolParams } from './getSpace.js';

describe('space tools collection', () => {
  it('should export spaceTools collection with correct structure', () => {
    expect(spaceTools).toBeDefined();
    expect(Object.keys(spaceTools)).toHaveLength(2);
  });

  it('should have listSpaces tool with correct properties', () => {
    const { listSpaces } = spaceTools;

    expect(listSpaces.title).toBe('list_spaces');
    expect(listSpaces.description).toBe('List all available spaces');
    expect(listSpaces.inputParams).toStrictEqual(ListSpacesToolParams.shape);
    expect(listSpaces.annotations).toEqual({
      readOnlyHint: true,
      openWorldHint: false,
    });
    expect(listSpaces.tool).toBe(listSpacesTool);
  });

  it('should have getSpace tool with correct properties', () => {
    const { getSpace } = spaceTools;

    expect(getSpace.title).toBe('get_space');
    expect(getSpace.description).toBe('Get details of a space');
    expect(getSpace.inputParams).toStrictEqual(GetSpaceToolParams.shape);
    expect(getSpace.annotations).toEqual({
      readOnlyHint: true,
      openWorldHint: false,
    });
    expect(getSpace.tool).toBe(getSpaceTool);
  });
});
