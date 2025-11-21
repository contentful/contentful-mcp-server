import { describe, it, expect } from 'vitest';
import { createSpaceTools } from './register.js';
import { ListSpacesToolParams } from './listSpaces.js';
import { GetSpaceToolParams } from './getSpace.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('space tools collection', () => {
  const mockConfig = createMockConfig();

  it('should export createSpaceTools factory function', () => {
    expect(createSpaceTools).toBeDefined();
    expect(typeof createSpaceTools).toBe('function');
  });

  it('should create spaceTools collection with correct structure', () => {
    const spaceTools = createSpaceTools(mockConfig);
    expect(spaceTools).toBeDefined();
    expect(Object.keys(spaceTools)).toHaveLength(2);
  });

  it('should have listSpaces tool with correct properties', () => {
    const spaceTools = createSpaceTools(mockConfig);
    const { listSpaces } = spaceTools;

    expect(listSpaces.title).toBe('list_spaces');
    expect(listSpaces.description).toBe('List all available spaces');
    expect(listSpaces.inputParams).toStrictEqual(ListSpacesToolParams.shape);
    expect(listSpaces.annotations).toEqual({
      readOnlyHint: true,
      openWorldHint: false,
    });
    expect(listSpaces.tool).toBeDefined();
    expect(typeof listSpaces.tool).toBe('function');
  });

  it('should have getSpace tool with correct properties', () => {
    const spaceTools = createSpaceTools(mockConfig);
    const { getSpace } = spaceTools;

    expect(getSpace.title).toBe('get_space');
    expect(getSpace.description).toBe('Get details of a space');
    expect(getSpace.inputParams).toStrictEqual(GetSpaceToolParams.shape);
    expect(getSpace.annotations).toEqual({
      readOnlyHint: true,
      openWorldHint: false,
    });
    expect(getSpace.tool).toBeDefined();
    expect(typeof getSpace.tool).toBe('function');
  });
});
