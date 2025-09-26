import { z } from 'zod';

/**
 * Zod schemas for AI Action Test Cases
 *
 * These schemas mirror the `AiActionTestCase` type from contentful-management
 * (see node_modules/contentful-management/dist/typings/entities/ai-action.d.ts)
 *
 * AI Action Test Cases are used to provide sample inputs for testing AI Actions
 * in Contentful. They can be either simple text inputs or references to existing
 * content entries that serve as examples for the AI Action.
 */

/**
 * Schema for text-based test cases
 *
 * Represents a simple text input that can be used to test an AI Action.
 * This is typically used for straightforward prompts or instructions
 * that don't require complex structured data.
 */
const TextTestCase = z.object({
  type: z.literal('Text').optional(),
  value: z.string().optional(),
});

/**
 * Schema for reference-based test cases
 *
 * Represents a test case that references an existing Contentful entry.
 * This is used when the AI Action needs to process structured content
 * or when testing with real-world examples from the content model.
 *
 * The reference includes:
 * - entityPath: The path to access specific fields within the entry
 * - entityType: The type of entity (currently only 'Entry' is supported)
 * - entityId: The unique identifier of the referenced entry
 */
const ReferenceTestCase = z.object({
  type: z.literal('Reference').optional(),
  value: z
    .object({
      entityPath: z.string().optional(),
      entityType: z.literal('Entry').optional(),
      entityId: z.string().optional(),
    })
    .optional(),
});

/**
 * Main schema for AI Action Test Cases
 *
 * This union type represents all possible test case formats for AI Actions.
 * It's used in the AI Action definition to provide sample inputs that can
 * be used to test the AI Action's functionality directly in the Contentful UI
 * or through the API.
 *
 * Test cases help content creators understand how the AI Action works and
 * provide developers with a way to test the AI Action's behavior with
 * representative examples.
 */
export const AiActionTestCaseSchema = z.union([
  TextTestCase,
  ReferenceTestCase,
]);

/**
 * Type derived from the AiActionTestCaseSchema
 *
 * Used for typing variables and parameters throughout the application when
 * working with AI Action test cases. This type ensures that all test cases
 * conform to either the text or reference format required by the Contentful API.
 */
export type AiActionTestCase = z.infer<typeof AiActionTestCaseSchema>;
