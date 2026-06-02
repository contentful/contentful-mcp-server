import { describe, it, expect } from 'vitest';
import { createEnvironmentTools } from './register.js';
import { CreateEnvironmentToolParams } from './createEnvironment.js';
import { ListEnvironmentsToolParams } from './listEnvironments.js';
import { DeleteEnvironmentToolParams } from './deleteEnvironment.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('environment tools collection', () => {
  const mockConfig = createMockConfig();

  it('should export createEnvironmentTools factory function', () => {
    expect(createEnvironmentTools).toBeDefined();
    expect(typeof createEnvironmentTools).toBe('function');
  });

  it('should create environmentTools collection with correct structure', () => {
    const environmentTools = createEnvironmentTools(mockConfig);
    expect(environmentTools).toBeDefined();
    expect(Object.keys(environmentTools)).toHaveLength(3);
  });

  it('should have createEnvironment tool with correct properties', () => {
    const environmentTools = createEnvironmentTools(mockConfig);
    const { createEnvironment } = environmentTools;

    expect(createEnvironment.title).toBe('create_environment');
    expect(createEnvironment.description).toBe('Create a new environment');
    expect(createEnvironment.inputParams).toStrictEqual(
      CreateEnvironmentToolParams.shape,
    );
    expect(createEnvironment.annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    });
    expect(createEnvironment.tool).toBeDefined();
    expect(typeof createEnvironment.tool).toBe('function');
  });

  it('should have listEnvironments tool with correct properties', () => {
    const environmentTools = createEnvironmentTools(mockConfig);
    const { listEnvironments } = environmentTools;

    expect(listEnvironments.title).toBe('list_environments');
    expect(listEnvironments.description).toBe(
      'List all environments in a space',
    );
    expect(listEnvironments.inputParams).toStrictEqual(
      ListEnvironmentsToolParams.shape,
    );
    expect(listEnvironments.annotations).toEqual({
      readOnlyHint: true,
      openWorldHint: false,
    });
    expect(listEnvironments.tool).toBeDefined();
    expect(typeof listEnvironments.tool).toBe('function');
  });

  it('should have deleteEnvironment tool with correct properties', () => {
    const environmentTools = createEnvironmentTools(mockConfig);
    const { deleteEnvironment } = environmentTools;

    expect(deleteEnvironment.title).toBe('delete_environment');
    expect(deleteEnvironment.description).toBe(
      'Delete an environment from your Contentful space. This is a two-phase operation: the first call (without confirm/confirmToken) returns a preview and a confirmToken. To complete the deletion, call this tool again with the same environmentId, confirm: true, and the confirmToken from the preview response.',
    );
    expect(deleteEnvironment.inputParams).toStrictEqual(
      DeleteEnvironmentToolParams.shape,
    );
    expect(deleteEnvironment.annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    });
    expect(deleteEnvironment.tool).toBeDefined();
    expect(typeof deleteEnvironment.tool).toBe('function');
  });
});
