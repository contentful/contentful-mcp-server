import { describe, it, expect } from 'vitest';
import {
  mockEditorInterfaceGet,
  mockEditorInterfaceUpdate,
  mockEditorInterface,
  mockArgs,
} from './mockClient.js';
import { updateEditorInterfaceTool } from './updateEditorInterface.js';
import { formatResponse } from '../../utils/formatters.js';

describe('updateEditorInterface', () => {
  it('should update an editor interface successfully', async () => {
    const updatedControls = [
      {
        fieldId: 'title',
        widgetId: 'singleLine',
        widgetNamespace: 'builtin' as const,
      },
      {
        fieldId: 'description',
        widgetId: 'multipleLine',
        widgetNamespace: 'builtin' as const,
      },
    ];

    const updatedEditorInterface = {
      ...mockEditorInterface,
      controls: updatedControls,
      sys: {
        ...mockEditorInterface.sys,
        version: 2,
      },
    };

    mockEditorInterfaceGet.mockResolvedValue(mockEditorInterface);
    mockEditorInterfaceUpdate.mockResolvedValue(updatedEditorInterface);

    const result = await updateEditorInterfaceTool({
      ...mockArgs,
      controls: updatedControls,
    });

    const expectedResponse = formatResponse(
      'Editor interface updated successfully',
      {
        editorInterface: updatedEditorInterface,
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

  it('should handle errors when update fails', async () => {
    const error = new Error('Failed to update editor interface');
    mockEditorInterfaceGet.mockResolvedValue(mockEditorInterface);
    mockEditorInterfaceUpdate.mockRejectedValue(error);

    const result = await updateEditorInterfaceTool({
      ...mockArgs,
      controls: [
        {
          fieldId: 'title',
          widgetId: 'singleLine',
          widgetNamespace: 'builtin',
        },
      ],
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error updating editor interface: Failed to update editor interface',
        },
      ],
    });
  });

  it('should preserve existing values when not provided', async () => {
    const updatedControls = [
      {
        fieldId: 'title',
        widgetId: 'slugEditor',
        widgetNamespace: 'builtin' as const,
      },
    ];

    const updatedEditorInterface = {
      ...mockEditorInterface,
      controls: updatedControls,
      // sidebar should be preserved from the original
      sys: {
        ...mockEditorInterface.sys,
        version: 2,
      },
    };

    mockEditorInterfaceGet.mockResolvedValue(mockEditorInterface);
    mockEditorInterfaceUpdate.mockResolvedValue(updatedEditorInterface);

    const result = await updateEditorInterfaceTool({
      ...mockArgs,
      controls: updatedControls,
      // Not providing sidebar should preserve existing sidebar
    });

    const expectedResponse = formatResponse(
      'Editor interface updated successfully',
      {
        editorInterface: updatedEditorInterface,
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
});
