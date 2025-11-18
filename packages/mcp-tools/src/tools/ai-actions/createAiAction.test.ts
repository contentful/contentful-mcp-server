import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAiActionTool } from './createAiAction.js';
import { formatResponse } from '../../utils/formatters.js';
import { VariableType } from '../../utils/ai-actions.js';
import {
  setupMockClient,
  mockAiActionCreate,
  mockAiAction,
  mockArgs,
  mockComplexAiAction,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('createAiAction', () => {
  beforeEach(() => {
    setupMockClient();
  });

  it('should create an AI action successfully with basic configuration', async () => {
    const testArgs = {
      ...mockArgs,
      name: 'Translation AI Action',
      description: 'Translates content between languages',
      instruction: {
        template:
          'Translate {{var.sourceContent}} from {{var.sourceLocale}} to {{var.targetLocale}}',
        variables: [
          {
            id: 'sourceContent',
            name: 'Source Content',
            type: VariableType.TEXT,
            description: 'Content to translate',
          },
          {
            id: 'sourceLocale',
            type: VariableType.LOCALE,
          },
          {
            id: 'targetLocale',
            type: VariableType.LOCALE,
          },
        ],
      },
      configuration: {
        modelType: 'gpt-4',
        modelTemperature: 0.3,
      },
    };

    mockAiActionCreate.mockResolvedValue(mockAiAction);

    const result = await createAiActionTool(testArgs);

    const expectedResponse = formatResponse('AI action created successfully', {
      aiAction: mockAiAction,
    });
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });
  });

  it('should create an AI action with complex variable types', async () => {
    const testArgs = {
      ...mockArgs,
      name: 'Complex AI Action',
      description: 'An AI action with various variable types',
      instruction: {
        template:
          'Process {{var.entryRef}} with {{var.smartContext}} for {{var.mediaRef}}',
        variables: [
          {
            id: 'entryRef',
            name: 'Entry Reference',
            type: VariableType.REFERENCE,
            description: 'Reference to entry',
          },
          {
            id: 'smartContext',
            name: 'Smart Context',
            type: VariableType.SMART_CONTEXT,
            description: 'AI context',
          },
          {
            id: 'mediaRef',
            name: 'Media Reference',
            type: VariableType.MEDIA_REFERENCE,
            description: 'Media asset reference',
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

    mockAiActionCreate.mockResolvedValue(mockComplexAiAction);

    const result = await createAiActionTool(testArgs);

    const expectedResponse = formatResponse('AI action created successfully', {
      aiAction: mockComplexAiAction,
    });
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });
  });

  it('should handle errors when AI action creation fails', async () => {
    const testArgs = {
      ...mockArgs,
      name: 'Invalid AI Action',
      description: 'An AI action that will fail',
      instruction: {
        template: 'Invalid template with {{var.nonExistentVariable}}',
        variables: [
          {
            id: 'existingVariable',
            type: VariableType.TEXT,
          },
        ],
      },
      configuration: {
        modelType: 'invalid-model',
        modelTemperature: 2.0, // Invalid temperature
      },
    };

    const error = new Error('Invalid model configuration');
    mockAiActionCreate.mockRejectedValue(error);

    const result = await createAiActionTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error creating AI action: Invalid model configuration',
        },
      ],
    });
  });
});
