import { describe, it, expect } from 'vitest';
import {
  mockEditorInterfaceGetMany,
  mockEditorInterfacesResponse,
  mockArgs,
} from './mockClient.js';
import { listEditorInterfacesTool } from './listEditorInterfaces.js';
import { formatResponse } from '../../utils/formatters.js';

describe('listEditorInterfaces', () => {
  it('should list editor interfaces successfully', async () => {
    mockEditorInterfaceGetMany.mockResolvedValue(mockEditorInterfacesResponse);

    const result = await listEditorInterfacesTool({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
    });

    const expectedData = {
      editorInterfaces: {
        total: 2,
        skip: 0,
        limit: 100,
        items: [
          {
            contentTypeId: 'test-content-type-id',
            version: 1,
            controlsCount: 2,
          },
          {
            contentTypeId: 'another-content-type',
            version: 1,
            controlsCount: 2,
          },
        ],
      },
      total: 2,
      limit: 100,
      skip: 0,
    };

    const expectedResponse = formatResponse(
      'Editor interfaces retrieved successfully',
      expectedData,
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

  it('should handle empty list of editor interfaces', async () => {
    const emptyResponse = {
      total: 0,
      skip: 0,
      limit: 100,
      items: [],
    };

    mockEditorInterfaceGetMany.mockResolvedValue(emptyResponse);

    const result = await listEditorInterfacesTool({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
    });

    const expectedData = {
      editorInterfaces: {
        total: 0,
        skip: 0,
        limit: 100,
        items: [],
      },
      total: 0,
      limit: 100,
      skip: 0,
    };

    const expectedResponse = formatResponse(
      'Editor interfaces retrieved successfully',
      expectedData,
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

  it('should handle errors when listing editor interfaces fails', async () => {
    const error = new Error('Failed to retrieve editor interfaces');
    mockEditorInterfaceGetMany.mockRejectedValue(error);

    const result = await listEditorInterfacesTool({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error listing editor interfaces: Failed to retrieve editor interfaces',
        },
      ],
    });
  });
});
