import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deleteAiActionTool } from './deleteAiAction.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockAiActionDelete,
  mockArgs,
  mockAiAction,
  mockAiActionGet,
} from './mockClient.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

vi.mock('../../../src/utils/tools.js');

describe('deleteAiAction', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    setupMockClient();
  });

  it('should delete an AI action successfully', async () => {
    mockAiActionGet.mockResolvedValue(mockAiAction);
    mockAiActionDelete.mockResolvedValue(undefined);

    const tool = deleteAiActionTool(mockConfig);
    const result = await tool(mockArgs);

    const expectedResponse = formatResponse('AI action deleted successfully', {
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

  it('should handle errors when AI action deletion fails', async () => {
    const error = new Error('AI action not found');
    mockAiActionDelete.mockRejectedValue(error);

    const tool = deleteAiActionTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error deleting AI action: AI action not found',
        },
      ],
    });
  });
});
