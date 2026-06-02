import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  testConcept,
  mockConceptGet,
  mockConceptDelete,
  mockCreateClient,
} from './mockClient.js';
import { deleteConceptTool } from './deleteConcept.js';
import { formatResponse } from '../../../utils/formatters.js';
import { createClientConfig } from '../../../utils/tools.js';
import { buildConfirmToken } from '../../../utils/confirmation.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('deleteConcept', () => {
  const mockConfig = createMockConfig();
  const baseArgs = {
    organizationId: 'test-org-id',
    conceptId: testConcept.sys.id,
  };
  const validToken = buildConfirmToken(
    'concept',
    testConcept.sys.id,
    testConcept.sys.version,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a confirmation preview when confirm is missing', async () => {
    mockConceptGet.mockResolvedValue(testConcept);

    const tool = deleteConceptTool(mockConfig);
    const result = await tool(baseArgs);

    expect(mockConceptDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
    expect(result.content[0].text).toContain(validToken);
  });

  it('returns a confirmation preview when confirmToken is wrong', async () => {
    mockConceptGet.mockResolvedValue(testConcept);

    const tool = deleteConceptTool(mockConfig);
    const result = await tool({ ...baseArgs, confirm: true, confirmToken: 'wrong' });

    expect(mockConceptDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('returns a confirmation preview when confirm is true but confirmToken is missing', async () => {
    mockConceptGet.mockResolvedValue(testConcept);

    const tool = deleteConceptTool(mockConfig);
    const result = await tool({ ...baseArgs, confirm: true });

    expect(mockConceptDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('returns a confirmation preview when confirm is false even with correct token', async () => {
    mockConceptGet.mockResolvedValue(testConcept);

    const tool = deleteConceptTool(mockConfig);
    const result = await tool({ ...baseArgs, confirm: false, confirmToken: validToken });

    expect(mockConceptDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('deletes with the server-fetched version when confirm is true and confirmToken matches', async () => {
    mockConceptGet.mockResolvedValue(testConcept);
    mockConceptDelete.mockResolvedValue(undefined);

    const tool = deleteConceptTool(mockConfig);
    const result = await tool({
      ...baseArgs,
      confirm: true,
      confirmToken: validToken,
    });

    const clientConfig = createClientConfig(mockConfig);
    expect(mockCreateClient).toHaveBeenCalledWith(clientConfig);
    expect(mockConceptDelete).toHaveBeenCalledWith({
      organizationId: baseArgs.organizationId,
      conceptId: baseArgs.conceptId,
      version: testConcept.sys.version,
    });

    const expected = formatResponse('Concept deleted successfully', {
      conceptId: baseArgs.conceptId,
    });
    expect(result).toEqual({ content: [{ type: 'text', text: expected }] });
  });

  it('handles errors when concept get fails before confirmation', async () => {
    mockConceptGet.mockRejectedValue(new Error('Concept not found'));

    const tool = deleteConceptTool(mockConfig);
    const result = await tool(baseArgs);

    expect(mockConceptDelete).not.toHaveBeenCalled();
    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error deleting concept: Concept not found' }],
    });
  });

  it('handles errors when deletion fails after confirmation', async () => {
    mockConceptGet.mockResolvedValue(testConcept);
    mockConceptDelete.mockRejectedValue(new Error('Version mismatch'));

    const tool = deleteConceptTool(mockConfig);
    const result = await tool({
      ...baseArgs,
      confirm: true,
      confirmToken: validToken,
    });

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error deleting concept: Version mismatch' }],
    });
  });
});
