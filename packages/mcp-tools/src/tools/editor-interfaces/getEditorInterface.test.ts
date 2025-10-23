import { describe, it, expect } from 'vitest';
import {
  mockEditorInterfaceGet,
  mockEditorInterface,
  mockArgs,
} from './mockClient.js';
import { getEditorInterfaceTool } from './getEditorInterface.js';
import { formatResponse } from '../../utils/formatters.js';

describe('getEditorInterface', () => {
  it('should retrieve an editor interface successfully', async () => {
    mockEditorInterfaceGet.mockResolvedValue(mockEditorInterface);

    const result = await getEditorInterfaceTool(mockArgs);

    const expectedResponse = formatResponse(
      'Editor interface retrieved successfully',
      {
        editorInterface: mockEditorInterface,
      },
    );

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });
  });

  it('should handle errors when editor interface is not found', async () => {
    const error = new Error('Editor interface not found');
    mockEditorInterfaceGet.mockRejectedValue(error);

    const result = await getEditorInterfaceTool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving editor interface: Editor interface not found',
        },
      ],
    });
  });
});
