import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  resolveEntryReferencesTool,
  ResolveEntryReferencesToolParams,
} from './resolveEntryReferences.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockEntryReferences,
  mockEntry,
  mockArgs,
} from './mockClient.js';

vi.mock('../../utils/tools.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../utils/tools.js')>();
  return {
    ...orig,
    createToolClient: vi.fn(),
  };
});
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('resolveEntryReferences', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
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

  it('should reject include values below 1 via the schema', () => {
    const result = ResolveEntryReferencesToolParams.safeParse({
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: 'test-entry-id',
      include: 0,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['include']);
  });

  it('should reject include values above 10 via the schema', () => {
    const result = ResolveEntryReferencesToolParams.safeParse({
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: 'test-entry-id',
      include: 11,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['include']);
  });

  it('should default include to 2 when omitted', () => {
    const result = ResolveEntryReferencesToolParams.parse({
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: 'test-entry-id',
    });

    expect(result.include).toBe(2);
  });

  it('should surface CMA errors via withErrorHandling', async () => {
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
