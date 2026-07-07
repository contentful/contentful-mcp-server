import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockComponentTypeGetMany, mockContentTypeGetMany, mockCreateToolClient } =
  vi.hoisted(() => {
    return {
      mockComponentTypeGetMany: vi.fn(),
      mockContentTypeGetMany: vi.fn(),
      mockCreateToolClient: vi.fn(() => ({
        componentType: { getMany: mockComponentTypeGetMany },
        contentType: { getMany: mockContentTypeGetMany },
      })),
    };
  });

vi.mock('../../utils/tools.js', async (importOriginal) => {
  const org = await importOriginal<typeof import('../../utils/tools.js')>();
  return {
    ...org,
    createToolClient: mockCreateToolClient,
  };
});

import { detectExoDisposition } from './detectExoDisposition.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('detectExoDisposition', () => {
  beforeEach(() => {
    mockComponentTypeGetMany.mockReset();
    mockContentTypeGetMany.mockReset();
    mockCreateToolClient.mockClear();
  });

  it('returns "exo" when a component type exists, without checking content types', async () => {
    const config = createMockConfig();
    mockComponentTypeGetMany.mockResolvedValue({ items: [{}], total: 1 });

    const result = await detectExoDisposition(config, 'space-a', 'master');

    expect(result).toBe('exo');
    expect(mockContentTypeGetMany).not.toHaveBeenCalled();
  });

  it('returns "empty" when neither component types nor content types exist', async () => {
    const config = createMockConfig();
    mockComponentTypeGetMany.mockResolvedValue({ items: [], total: 0 });
    mockContentTypeGetMany.mockResolvedValue({ items: [], total: 0 });

    const result = await detectExoDisposition(config, 'space-a', 'master');

    expect(result).toBe('empty');
  });

  it('returns "classic" when content types exist but no component types', async () => {
    const config = createMockConfig();
    mockComponentTypeGetMany.mockResolvedValue({ items: [], total: 0 });
    mockContentTypeGetMany.mockResolvedValue({ items: [{}], total: 1 });

    const result = await detectExoDisposition(config, 'space-a', 'master');

    expect(result).toBe('classic');
  });

  it('returns undefined when the component type call throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const config = createMockConfig();
    mockComponentTypeGetMany.mockRejectedValue(new Error('network error'));

    const result = await detectExoDisposition(config, 'space-a', 'master');

    expect(result).toBeUndefined();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it('returns undefined when the content type call throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const config = createMockConfig();
    mockComponentTypeGetMany.mockResolvedValue({ items: [], total: 0 });
    mockContentTypeGetMany.mockRejectedValue(new Error('network error'));

    const result = await detectExoDisposition(config, 'space-a', 'master');

    expect(result).toBeUndefined();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it('falls back to items.length when total is absent', async () => {
    const config = createMockConfig();
    mockComponentTypeGetMany.mockResolvedValue({ items: [{}] });

    const result = await detectExoDisposition(config, 'space-a', 'master');

    expect(result).toBe('exo');
  });
});
