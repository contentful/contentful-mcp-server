import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateReleaseTool } from './validateRelease.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockReleaseValidate,
  mockArgs,
  mockReleaseAction,
} from './mockClient.js';

vi.mock('../../utils/tools.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../utils/tools.js')>();
  return {
    ...orig,
    createToolClient: vi.fn(),
  };
});
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('validateRelease', () => {
  const mockConfig = createMockConfig();
  const validateAction = { ...mockReleaseAction, action: 'validate' as const };

  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  it('validates a release with no action payload', async () => {
    mockReleaseValidate.mockResolvedValue(validateAction);

    const tool = validateReleaseTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockReleaseValidate).toHaveBeenCalledWith(
      {
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
        releaseId: mockArgs.releaseId,
      },
      undefined,
    );

    const expectedResponse = formatResponse('Release validation queued', {
      actionId: validateAction.sys.id,
      status: validateAction.sys.status,
      releaseId: mockArgs.releaseId,
      note: 'Use get_release_action with this actionId to check whether validation succeeded.',
    });
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
  });

  it('validates against a specific downstream action', async () => {
    mockReleaseValidate.mockResolvedValue(validateAction);

    const tool = validateReleaseTool(mockConfig);
    await tool({ ...mockArgs, action: 'unpublish' as const });

    expect(mockReleaseValidate).toHaveBeenCalledWith(
      {
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
        releaseId: mockArgs.releaseId,
      },
      { action: 'unpublish' },
    );
  });

  it('does not require environment protection since validate is non-mutating', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    mockReleaseValidate.mockResolvedValue(validateAction);

    const tool = validateReleaseTool(protectedConfig);
    const result = await tool({ ...mockArgs, environmentId: 'master' });

    expect(result.content[0].text).toContain('Release validation queued');
    expect(mockReleaseValidate).toHaveBeenCalled();
  });

  it('handles errors when validate call fails', async () => {
    mockReleaseValidate.mockRejectedValue(new Error('Release not found'));

    const tool = validateReleaseTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error validating release: Release not found' },
      ],
    });
  });
});
