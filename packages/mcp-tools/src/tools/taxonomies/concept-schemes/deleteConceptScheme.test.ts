import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  testConceptScheme,
  mockConceptSchemeGet,
  mockConceptSchemeDelete,
  mockCreateClient,
} from './mockClient.js';
import { deleteConceptSchemeTool } from './deleteConceptScheme.js';
import { createClientConfig } from '../../../utils/tools.js';
import { formatResponse } from '../../../utils/formatters.js';
import { buildConfirmToken } from '../../../utils/confirmation.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('deleteConceptScheme', () => {
  const mockConfig = createMockConfig();
  const baseArgs = {
    organizationId: 'test-org-id',
    conceptSchemeId: testConceptScheme.sys.id,
  };
  const validToken = buildConfirmToken(
    'conceptScheme',
    testConceptScheme.sys.id,
    testConceptScheme.sys.version,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a confirmation preview when confirm is missing', async () => {
    mockConceptSchemeGet.mockResolvedValue(testConceptScheme);

    const tool = deleteConceptSchemeTool(mockConfig);
    const result = await tool(baseArgs);

    expect(mockConceptSchemeDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
    expect(result.content[0].text).toContain(validToken);
  });

  it('returns a confirmation preview when confirmToken is wrong', async () => {
    mockConceptSchemeGet.mockResolvedValue(testConceptScheme);

    const tool = deleteConceptSchemeTool(mockConfig);
    const result = await tool({ ...baseArgs, confirm: true, confirmToken: 'wrong' });

    expect(mockConceptSchemeDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('returns a confirmation preview when confirm is true but confirmToken is missing', async () => {
    mockConceptSchemeGet.mockResolvedValue(testConceptScheme);

    const tool = deleteConceptSchemeTool(mockConfig);
    const result = await tool({ ...baseArgs, confirm: true });

    expect(mockConceptSchemeDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('returns a confirmation preview when confirm is false even with correct token', async () => {
    mockConceptSchemeGet.mockResolvedValue(testConceptScheme);

    const tool = deleteConceptSchemeTool(mockConfig);
    const result = await tool({ ...baseArgs, confirm: false, confirmToken: validToken });

    expect(mockConceptSchemeDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('deletes with the server-fetched version when confirm is true and confirmToken matches', async () => {
    mockConceptSchemeGet.mockResolvedValue(testConceptScheme);
    mockConceptSchemeDelete.mockResolvedValue(undefined);

    const tool = deleteConceptSchemeTool(mockConfig);
    const result = await tool({
      ...baseArgs,
      confirm: true,
      confirmToken: validToken,
    });

    const clientConfig = createClientConfig(mockConfig);
    expect(mockCreateClient).toHaveBeenCalledWith(clientConfig);
    expect(mockConceptSchemeDelete).toHaveBeenCalledWith({
      organizationId: baseArgs.organizationId,
      conceptSchemeId: baseArgs.conceptSchemeId,
      version: testConceptScheme.sys.version,
    });

    const expected = formatResponse('Concept scheme deleted successfully', {
      conceptSchemeId: baseArgs.conceptSchemeId,
    });
    expect(result).toEqual({ content: [{ type: 'text', text: expected }] });
  });

  it('handles errors when concept scheme get fails before confirmation', async () => {
    mockConceptSchemeGet.mockRejectedValue(new Error('Concept scheme not found'));

    const tool = deleteConceptSchemeTool(mockConfig);
    const result = await tool(baseArgs);

    expect(mockConceptSchemeDelete).not.toHaveBeenCalled();
    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error deleting concept scheme: Concept scheme not found',
        },
      ],
    });
  });

  it('handles errors when deletion fails after confirmation', async () => {
    mockConceptSchemeGet.mockResolvedValue(testConceptScheme);
    mockConceptSchemeDelete.mockRejectedValue(new Error('Version mismatch'));

    const tool = deleteConceptSchemeTool(mockConfig);
    const result = await tool({
      ...baseArgs,
      confirm: true,
      confirmToken: validToken,
    });

    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error deleting concept scheme: Version mismatch' },
      ],
    });
  });
});
