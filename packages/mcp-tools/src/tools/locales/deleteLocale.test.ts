import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockArgs,
  testLocale,
  mockLocaleGet,
  mockLocaleDelete,
} from './mockClient.js';
import { deleteLocaleTool } from './deleteLocale.js';
import { formatResponse } from '../../utils/formatters.js';
import { buildConfirmToken } from '../../utils/confirmation.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('deleteLocaleTool', () => {
  const mockConfig = createMockConfig();
  const localeId = testLocale.sys.id;
  const validToken = buildConfirmToken(
    'locale',
    localeId,
    testLocale.sys.version,
  );
  const baseArgs = { ...mockArgs, localeId };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a confirmation preview when confirm is missing', async () => {
    mockLocaleGet.mockResolvedValue(testLocale);

    const tool = deleteLocaleTool(mockConfig);
    const result = await tool(baseArgs);

    expect(mockLocaleDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
    expect(result.content[0].text).toContain(validToken);
  });

  it('returns a confirmation preview when confirmToken is wrong', async () => {
    mockLocaleGet.mockResolvedValue(testLocale);

    const tool = deleteLocaleTool(mockConfig);
    const result = await tool({
      ...baseArgs,
      confirm: true,
      confirmToken: 'wrong',
    });

    expect(mockLocaleDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('returns a confirmation preview when confirm is true but confirmToken is missing', async () => {
    mockLocaleGet.mockResolvedValue(testLocale);

    const tool = deleteLocaleTool(mockConfig);
    const result = await tool({ ...baseArgs, confirm: true });

    expect(mockLocaleDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('returns a confirmation preview when confirm is false even with correct token', async () => {
    mockLocaleGet.mockResolvedValue(testLocale);

    const tool = deleteLocaleTool(mockConfig);
    const result = await tool({
      ...baseArgs,
      confirm: false,
      confirmToken: validToken,
    });

    expect(mockLocaleDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('deletes when confirm is true and confirmToken matches', async () => {
    mockLocaleGet.mockResolvedValue(testLocale);
    mockLocaleDelete.mockResolvedValue(undefined);

    const tool = deleteLocaleTool(mockConfig);
    const result = await tool({
      ...baseArgs,
      confirm: true,
      confirmToken: validToken,
    });

    expect(mockLocaleDelete).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      localeId,
    });
    const expected = formatResponse('Locale deleted successfully', {
      locale: testLocale,
    });
    expect(result).toEqual({ content: [{ type: 'text', text: expected }] });
  });

  it('handles errors when locale get fails before confirmation', async () => {
    mockLocaleGet.mockRejectedValue(new Error('Locale not found'));

    const tool = deleteLocaleTool(mockConfig);
    const result = await tool(baseArgs);

    expect(mockLocaleDelete).not.toHaveBeenCalled();
    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error deleting locale: Locale not found' },
      ],
    });
  });

  it('handles errors when deletion fails after confirmation', async () => {
    mockLocaleGet.mockResolvedValue(testLocale);
    mockLocaleDelete.mockRejectedValue(new Error('Deletion failed'));

    const tool = deleteLocaleTool(mockConfig);
    const result = await tool({
      ...baseArgs,
      confirm: true,
      confirmToken: validToken,
    });

    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error deleting locale: Deletion failed' },
      ],
    });
  });

  it('should return error when environment is protected', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    const tool = deleteLocaleTool(protectedConfig);
    const result = await tool({
      ...mockArgs,
      environmentId: 'master',
      localeId: 'test-locale-id',
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error deleting locale: Environment 'master' is protected. Write and delete operations are not allowed.",
        },
      ],
    });
    expect(mockLocaleDelete).not.toHaveBeenCalled();
  });
});
