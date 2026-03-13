import { describe, it, expect } from 'vitest';

import { jsonValueSchema } from '../../types/entryFieldSchema.js';

describe('entry zod schema ', () => {
  describe('entry fields', () => {
    describe('JSON fields', () => {
      it('should validate a simple JSON object', () => {
        const json = [
          {
            foo: 'bar',
            value: 42,
            isActive: true,
            tags: ['tag1', 'tag2'],
            metadata: {
              createdBy: 'User123',
              createdAt: '2024-01-01T00:00:00Z',
            },
          },
          {
            foo: 'baz',
          },
        ];

        expect(jsonValueSchema.parse(json)).toEqual(json);
      });
    });
  });
});
