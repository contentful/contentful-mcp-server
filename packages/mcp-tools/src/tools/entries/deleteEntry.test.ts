import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deleteEntryTool } from './deleteEntry.js';
import { formatResponse } from '../../utils/formatters.js';
import { buildConfirmToken } from '../../utils/confirmation.js';
import {
  setupMockClient,
  mockEntryGet,
  mockEntryDelete,
  mockEntry,
  mockArgs,
} from './mockClient.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

vi.mock('../../../src/utils/tools.js');

describe('deleteEntry', () => {
  const mockConfig = createMockConfig();
  const validToken = buildConfirmToken('entry', mockArgs.entryId, mockEntry.sys.version);

  beforeEach(() => {
    vi.clearAllMocks();
    setupMockClient();
  });

  it('returns a confirmation preview when confirm is missing', async () => {
    mockEntryGet.mockResolvedValue(mockEntry);

    const tool = deleteEntryTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockEntryDelete).not.toHaveBeenCalled();
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('Confirmation required to delete');
    expect(result.content[0].text).toContain(validToken);
  });

  it('returns a confirmation preview when confirmToken is wrong', async () => {
    mockEntryGet.mockResolvedValue(mockEntry);

    const tool = deleteEntryTool(mockConfig);
    const result = await tool({ ...mockArgs, confirm: true, confirmToken: 'wrong' });

    expect(mockEntryDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('returns a confirmation preview when confirm is true but confirmToken is missing', async () => {
    mockEntryGet.mockResolvedValue(mockEntry);

    const tool = deleteEntryTool(mockConfig);
    const result = await tool({ ...mockArgs, confirm: true });

    expect(mockEntryDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('returns a confirmation preview when confirm is false even with correct token', async () => {
    mockEntryGet.mockResolvedValue(mockEntry);

    const tool = deleteEntryTool(mockConfig);
    const result = await tool({ ...mockArgs, confirm: false, confirmToken: validToken });

    expect(mockEntryDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('deletes when confirm is true and confirmToken matches', async () => {
    mockEntryGet.mockResolvedValue(mockEntry);
    mockEntryDelete.mockResolvedValue(undefined);

    const tool = deleteEntryTool(mockConfig);
    const result = await tool({ ...mockArgs, confirm: true, confirmToken: validToken });

    expect(mockEntryDelete).toHaveBeenCalledOnce();
    const expected = formatResponse('Entry deleted successfully', { entry: mockEntry });
    expect(result).toEqual({ content: [{ type: 'text', text: expected }] });
  });

  it('handles errors when entry get fails before confirmation', async () => {
    mockEntryGet.mockRejectedValue(new Error('Entry not found'));

    const tool = deleteEntryTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error deleting entry: Entry not found' }],
    });
  });

  it('handles errors when deletion fails after confirmation', async () => {
    mockEntryGet.mockResolvedValue(mockEntry);
    mockEntryDelete.mockRejectedValue(new Error('Deletion failed'));

    const tool = deleteEntryTool(mockConfig);
    const result = await tool({ ...mockArgs, confirm: true, confirmToken: validToken });

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error deleting entry: Deletion failed' }],
    });
  });
});
