import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resolveEntryReferencesTool } from './resolveEntryReferences.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockEntryReferences,
  mockEntry,
  mockArgs,
} from './mockClient.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

vi.mock('../../../src/utils/tools.js');

describe('resolveEntryReferences', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    setupMockClient();
    mockEntryReferences.mockReset();
  });

  it('should resolve entry references successfully', async () => {
    const mockResponse = {
      sys: { type: 'Array' },
      total: 1,
      skip: 0,
      limit: 100,
      items: [mockEntry],
      includes: {
        Entry: [mockEntry],
        Asset: [],
      },
    };
    mockEntryReferences.mockResolvedValue(mockResponse);

    const tool = resolveEntryReferencesTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      entryId: 'test-entry-id',
    });

    const expectedResponse = formatResponse(
      'Entry references retrieved successfully',
      { references: mockResponse },
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
    expect(mockEntryReferences).toHaveBeenCalledWith({
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: 'test-entry-id',
      include: 2,
    });
  });

  it('should pass a custom include depth to the CMA client', async () => {
    mockEntryReferences.mockResolvedValue({
      sys: { type: 'Array' },
      total: 0,
      skip: 0,
      limit: 100,
      items: [],
    });

    const tool = resolveEntryReferencesTool(mockConfig);
    await tool({
      ...mockArgs,
      entryId: 'test-entry-id',
      include: 5,
    });

    expect(mockEntryReferences).toHaveBeenCalledWith({
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: 'test-entry-id',
      include: 5,
    });
  });

  it('should reject include values below 1', async () => {
    const tool = resolveEntryReferencesTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      entryId: 'test-entry-id',
      include: 0,
    } as unknown as Parameters<typeof tool>[0]);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/include/i);
    expect(mockEntryReferences).not.toHaveBeenCalled();
  });

  it('should reject include values above 10', async () => {
    const tool = resolveEntryReferencesTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      entryId: 'test-entry-id',
      include: 11,
    } as unknown as Parameters<typeof tool>[0]);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/include/i);
    expect(mockEntryReferences).not.toHaveBeenCalled();
  });

  it('should handle errors when CMA call fails', async () => {
    const error = new Error('Entry not found');
    mockEntryReferences.mockRejectedValue(error);

    const tool = resolveEntryReferencesTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      entryId: 'missing-entry-id',
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error resolving entry references: Entry not found',
        },
      ],
    });
  });
});
