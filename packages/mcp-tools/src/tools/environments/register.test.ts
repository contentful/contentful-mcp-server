import { describe, it, expect } from 'vitest';
import { environmentTools } from './register.js';
import {
  createEnvironmentTool,
  CreateEnvironmentToolParams,
} from './createEnvironment.js';
import {
  listEnvironmentsTool,
  ListEnvironmentsToolParams,
} from './listEnvironments.js';
import {
  deleteEnvironmentTool,
  DeleteEnvironmentToolParams,
} from './deleteEnvironment.js';

describe('environment tools collection', () => {
  it('should export environmentTools collection with correct structure', () => {
    expect(environmentTools).toBeDefined();
    expect(Object.keys(environmentTools)).toHaveLength(3);
  });

  it('should have createEnvironment tool with correct properties', () => {
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
    expect(createEnvironment.tool).toBe(createEnvironmentTool);
  });

  it('should have listEnvironments tool with correct properties', () => {
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
    expect(listEnvironments.tool).toBe(listEnvironmentsTool);
  });

  it('should have deleteEnvironment tool with correct properties', () => {
    const { deleteEnvironment } = environmentTools;

    expect(deleteEnvironment.title).toBe('delete_environment');
    expect(deleteEnvironment.description).toBe('Delete an environment');
    expect(deleteEnvironment.inputParams).toStrictEqual(
      DeleteEnvironmentToolParams.shape,
    );
    expect(deleteEnvironment.annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    });
    expect(deleteEnvironment.tool).toBe(deleteEnvironmentTool);
  });
});
