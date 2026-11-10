import { describe, it, expect } from 'vitest';
import { toJsonSchemaCompat } from '@modelcontextprotocol/sdk/server/zod-json-schema-compat.js';
import { CreateDataAssemblyToolParams } from './createDataAssembly.js';
import { UpdateDataAssemblyToolParams } from './updateDataAssembly.js';

const advertisedReturn = (schema: Parameters<typeof toJsonSchemaCompat>[0]) => {
  const json = toJsonSchemaCompat(schema) as {
    properties: Record<string, Record<string, unknown>>;
  };
  return json.properties['return'];
};

describe('data assembly return mapping schema', () => {
  it.each([
    ['create_data_assembly', CreateDataAssemblyToolParams],
    ['update_data_assembly', UpdateDataAssemblyToolParams],
  ])(
    'advertises %s `return` inline instead of a bare $ref',
    (_name, schema) => {
      const advertised = advertisedReturn(schema);

      expect(advertised['$ref']).toBeUndefined();
      expect(Array.isArray(advertised['anyOf'])).toBe(true);
    },
  );

  it('accepts a stringified return mapping on update and passes an object on', () => {
    const parsed = UpdateDataAssemblyToolParams.parse({
      spaceId: 's',
      environmentId: 'e',
      dataAssemblyId: 'd',
      version: 1,
      return: JSON.stringify({ label: '$parameters/label' }),
    });

    expect(parsed.return).toEqual({ label: '$parameters/label' });
  });
});
