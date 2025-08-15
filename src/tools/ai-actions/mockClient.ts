import { vi } from 'vitest';
import { createToolClient } from '../../utils/tools.js';
import { VariableType, OutputFormat } from '../../utils/ai-actions.js';

/**
 * Shared mock objects for AI action tests
 * Provides standardized mock client and AI action objects used across all AI action tests
 */

// Create mock functions for the client
export const mockAiActionGet = vi.fn();
export const mockAiActionCreate = vi.fn();
export const mockAiActionUpdate = vi.fn();
export const mockAiActionDelete = vi.fn();
export const mockAiActionPublish = vi.fn();
export const mockAiActionUnpublish = vi.fn();
export const mockAiActionGetMany = vi.fn();
export const mockAiActionInvoke = vi.fn();
export const mockAiActionInvocationGet = vi.fn();

/**
 * Standard mock Contentful client with all AI action operations
 */
export const mockClient = {
  aiAction: {
    get: mockAiActionGet,
    create: mockAiActionCreate,
    update: mockAiActionUpdate,
    delete: mockAiActionDelete,
    publish: mockAiActionPublish,
    unpublish: mockAiActionUnpublish,
    getMany: mockAiActionGetMany,
    invoke: mockAiActionInvoke,
  },
  aiActionInvocation: {
    get: mockAiActionInvocationGet,
  },
};

/**
 * Sets up the mock client for tests
 * Call this in beforeEach to ensure the mock is properly configured
 */
export function setupMockClient() {
  vi.mocked(createToolClient).mockReturnValue(
    mockClient as unknown as ReturnType<typeof createToolClient>,
  );
}

/**
 * Standard mock AI action object used across tests
 */
export const mockAiAction = {
  sys: {
    id: 'test-ai-action-id',
    type: 'AiAction' as const,
    version: 1,
    space: {
      sys: {
        type: 'Link' as const,
        linkType: 'Space' as const,
        id: 'test-space-id',
      },
    },
    environment: {
      sys: {
        type: 'Link' as const,
        linkType: 'Environment' as const,
        id: 'test-environment',
      },
    },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    publishedVersion: undefined,
  },
  name: 'Test AI Action',
  description: 'A test AI action for unit tests',
  instruction: {
    template:
      'Translate the following text from {{var.sourceLocale}} to {{var.targetLocale}}: {{var.sourceContent}}',
    variables: [
      {
        id: 'sourceContent',
        name: 'Source Content',
        type: VariableType.TEXT,
        description: 'The content to be translated',
      },
      {
        id: 'sourceLocale',
        name: 'Source Locale',
        type: VariableType.LOCALE,
        description: 'The source language locale',
      },
      {
        id: 'targetLocale',
        name: 'Target Locale',
        type: VariableType.LOCALE,
        description: 'The target language locale',
      },
    ],
  },
  configuration: {
    modelType: 'gpt-4',
    modelTemperature: 0.3,
  },
  testCases: [],
};

/**
 * Mock AI action with published version
 */
export const mockPublishedAiAction = {
  ...mockAiAction,
  sys: {
    ...mockAiAction.sys,
    publishedVersion: 1,
  },
};

/**
 * Standard test arguments for AI action operations
 */
export const mockArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
  aiActionId: 'test-ai-action-id',
};

/**
 * Mock AI action invocation result
 */
export const mockAiActionInvocation = {
  sys: {
    id: 'test-invocation-id',
    type: 'AiActionInvocation' as const,
    status: 'COMPLETED' as const,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  result: {
    content: 'Translated content result',
  },
};

/**
 * Mock AI action invocation status response
 */
export const mockInvocationStatusResponse = {
  sys: {
    id: 'test-invocation-id',
    status: 'COMPLETED' as const,
  },
  result: {
    content: 'AI action completed successfully',
  },
};

/**
 * Mock AI actions list response
 */
export const mockAiActionsResponse = {
  total: 2,
  skip: 0,
  limit: 3,
  items: [
    mockAiAction,
    {
      ...mockAiAction,
      sys: { ...mockAiAction.sys, id: 'another-ai-action' },
      name: 'Another AI Action',
      description: 'Another test AI action',
    },
  ],
};

/**
 * Mock variable values for AI action invocation
 */
export const mockVariables = [
  {
    id: 'sourceContent',
    value: 'Hello, world!',
  },
  {
    id: 'sourceLocale',
    value: 'en-US',
  },
  {
    id: 'targetLocale',
    value: 'es-ES',
  },
];

/**
 * Mock fields for AI action invocation
 */
export const mockInvocationFields = [
  {
    outputFormat: OutputFormat.PLAIN_TEXT,
    variables: mockVariables,
  },
];

/**
 * Mock complex AI action with all field types
 */
export const mockComplexAiAction = {
  ...mockAiAction,
  name: 'Complex AI Action',
  description: 'An AI action with complex variable types',
  instruction: {
    template:
      'Process content from {{var.entryRef}} with context {{var.smartContext}} for {{var.mediaRef}}',
    variables: [
      {
        id: 'entryRef',
        name: 'Entry Reference',
        type: VariableType.REFERENCE,
        description: 'Reference to a content entry',
      },
      {
        id: 'smartContext',
        name: 'Smart Context',
        type: VariableType.SMART_CONTEXT,
        description: 'AI-powered context understanding',
      },
      {
        id: 'mediaRef',
        name: 'Media Reference',
        type: VariableType.MEDIA_REFERENCE,
        description: 'Reference to media assets',
      },
    ],
  },
  configuration: {
    modelType: 'gpt-3.5-turbo',
    modelTemperature: 0.7,
  },
  testCases: [
    {
      name: 'Test case 1',
      variables: {},
    },
  ],
};
