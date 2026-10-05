import { BLOCKS } from '@contentful/rich-text-types';
import { describe, it, expect } from 'vitest';

import {
  entryFieldsSchema,
  jsonValueSchema,
} from '../../types/entryFieldSchema.js';
import { complexRichTextExample } from './mock-data/complex-rich-text-example.js';
import { richTextDocumentSchema } from '../../types/richTextSchema.js';
import { CreateEntryToolParams } from './createEntry.js';

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

    describe('Rich Text fields', () => {
      const incompleteRichText = {
        nodeType: BLOCKS.DOCUMENT,
        content: [
          {
            nodeType: 'paragraph',
            content: [{ nodeType: 'text', value: 'hello' }],
          },
        ],
      };

      it('should validate a complex Rich Text document', () => {
        expect(() =>
          richTextDocumentSchema.parse(complexRichTextExample['en-US']),
        ).not.toThrow();
      });

      it('should reject incomplete Rich Text documents at the entry fields layer', () => {
        expect(
          richTextDocumentSchema.safeParse(incompleteRichText).success,
        ).toBe(false);
        expect(
          entryFieldsSchema.safeParse({
            body: { 'en-US': incompleteRichText },
          }).success,
        ).toBe(false);
      });

      it('should reject incomplete Rich Text for create_entry tool params', () => {
        expect(
          CreateEntryToolParams.safeParse({
            spaceId: 'space',
            environmentId: 'master',
            contentTypeId: 'blogPost',
            fields: {
              body: { 'en-US': incompleteRichText },
            },
          }).success,
        ).toBe(false);
      });

      it('should allow generic JSON objects that nest document-shaped values', () => {
        const jsonWithNestedDocument = {
          metadata: {
            preview: {
              nodeType: BLOCKS.DOCUMENT,
              content: [],
            },
          },
        };

        expect(jsonValueSchema.safeParse(jsonWithNestedDocument).success).toBe(
          true,
        );
        expect(
          entryFieldsSchema.safeParse({
            config: { 'en-US': jsonWithNestedDocument },
          }).success,
        ).toBe(true);
      });
    });
  });
});
