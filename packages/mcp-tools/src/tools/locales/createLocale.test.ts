import { describe, it, expect } from 'vitest';
import { mockArgs, testLocale, mockLocaleCreate } from './mockClient.js';

import { createLocaleTool } from './createLocale.js';
import { createToolClient } from '../../utils/tools.js';
import { formatResponse } from '../../utils/formatters.js';

describe('createLocale', () => {
  it('should create a locale successfully with default values', async () => {
    const testArgs = {
      ...mockArgs,
      name: 'Test Loc2ale',
      code: 'en-US',
      fallbackCode: null,
      contentDeliveryApi: true,
      contentManagementApi: true,
      default: false,
      optional: false,
    };
    mockLocaleCreate.mockResolvedValue(testLocale);

    const result = await createLocaleTool(testArgs);
    expect(createToolClient).toHaveBeenCalledWith(testArgs);
    expect(mockLocaleCreate).toHaveBeenCalledWith(
      {
        spaceId: testArgs.spaceId,
        environmentId: testArgs.environmentId,
      },
      {
        name: testArgs.name,
        code: testArgs.code,
        fallbackCode: testArgs.fallbackCode,
        contentDeliveryApi: true,
        contentManagementApi: true,
        optional: false,
      },
    );

    const expectedResponse = formatResponse('Locale created successfully', {
      newLocale: testLocale,
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

  it('should create a locale successfully with all parameters', async () => {
    const testArgs = {
      ...mockArgs,
      name: 'German (Germany)',
      code: 'de-DE',
      fallbackCode: 'en-US',
      contentDeliveryApi: false,
      contentManagementApi: false,
      default: true,
      optional: true,
    };

    const mockCreatedLocale = {
      ...testLocale,
      name: testArgs.name,
      code: testArgs.code,
      fallbackCode: testArgs.fallbackCode,
      default: testArgs.default,
      optional: testArgs.optional,
    };

    mockLocaleCreate.mockResolvedValue(mockCreatedLocale);

    const result = await createLocaleTool(testArgs);

    expect(createToolClient).toHaveBeenCalledWith(testArgs);
    expect(mockLocaleCreate).toHaveBeenCalledWith(
      {
        spaceId: testArgs.spaceId,
        environmentId: testArgs.environmentId,
      },
      {
        name: testArgs.name,
        code: testArgs.code,
        fallbackCode: testArgs.fallbackCode,
        contentDeliveryApi: testArgs.contentDeliveryApi,
        contentManagementApi: testArgs.contentManagementApi,
        optional: testArgs.optional,
      },
    );

    const expectedResponse = formatResponse('Locale created successfully', {
      newLocale: mockCreatedLocale,
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

  it('should handle errors when locale creation fails', async () => {
    const testArgs = {
      ...mockArgs,
      name: 'Invalid Locale',
      code: 'invalid-code',
      fallbackCode: null,
      contentDeliveryApi: true,
      contentManagementApi: true,
      default: false,
      optional: false,
    };

    const error = new Error('Validation error');
    mockLocaleCreate.mockRejectedValue(error);

    const result = await createLocaleTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error creating locale: Validation error',
        },
      ],
    });
  });
});
