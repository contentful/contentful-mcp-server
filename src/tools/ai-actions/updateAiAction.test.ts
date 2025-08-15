import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateAiActionTool } from './updateAiAction.js';
import { formatResponse } from '../../utils/formatters.js';
import { VariableType } from '../../utils/ai-actions.js';
import {
  setupMockClient,
  mockAiActionUpdate,
  mockAiAction,
  mockArgs,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('updateAiAction', () => {
  beforeEach(() => {
    setupMockClient();
  });

  it('should update an AI action successfully with all fields', async () => {
    const testArgs = {
      ...mockArgs,
      name: 'Updated AI Action',
      description: 'Updated description',
      instruction: {
        template: 'Updated template: {{var.input}}',
        variables: [
          {
            id: 'input',
            name: 'Input Text',
            type: VariableType.TEXT,
            description: 'Text to process',
          },
        ],
      },
      configuration: {
        modelType: 'gpt-4-turbo',
        modelTemperature: 0.2,
      },
      testCases: [
        {
          name: 'Updated test case',
          variables: {
            input: 'test input',
          },
        },
      ],
    };

    const updatedAiAction = {
      ...mockAiAction,
      name: 'Updated AI Action',
      description: 'Updated description',
      instruction: testArgs.instruction,
      configuration: testArgs.configuration,
      testCases: testArgs.testCases,
    };

    mockAiActionUpdate.mockResolvedValue(updatedAiAction);

    const result = await updateAiActionTool(testArgs);

    const expectedResponse = formatResponse('AI action updated successfully', {
      updatedAiAction: updatedAiAction,
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

  it('should update only specific fields when provided', async () => {
    const testArgs = {
      ...mockArgs,
      name: 'New Name Only',
    };

    const updatedAiAction = {
      ...mockAiAction,
      name: 'New Name Only',
    };

    mockAiActionUpdate.mockResolvedValue(updatedAiAction);

    const result = await updateAiActionTool(testArgs);

    const expectedResponse = formatResponse('AI action updated successfully', {
      updatedAiAction: updatedAiAction,
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

  it('should handle errors when AI action update fails', async () => {
    const testArgs = {
      ...mockArgs,
      name: 'Invalid Update',
    };

    const error = new Error('AI action not found');
    mockAiActionUpdate.mockRejectedValue(error);

    const result = await updateAiActionTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error updating AI action: AI action not found',
        },
      ],
    });
  });
});
