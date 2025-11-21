import { describe, it, expect } from 'vitest';
import { createLocaleTools } from './register.js';
import { GetLocaleToolParams } from './getLocale.js';
import { CreateLocaleToolParams } from './createLocale.js';
import { ListLocaleToolParams } from './listLocales.js';
import { UpdateLocaleToolParams } from './updateLocale.js';
import { DeleteLocaleToolParams } from './deleteLocale.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('locale tools collection', () => {
  const mockConfig = createMockConfig();

  it('should export createLocaleTools factory function', () => {
    expect(createLocaleTools).toBeDefined();
    expect(typeof createLocaleTools).toBe('function');
  });

  it('should create localeTools collection with correct structure', () => {
    const localeTools = createLocaleTools(mockConfig);
    expect(localeTools).toBeDefined();
    expect(Object.keys(localeTools)).toHaveLength(5);
  });

  it('should have getLocale tool with correct properties', () => {
    const localeTools = createLocaleTools(mockConfig);
    const { getLocale } = localeTools;

    expect(getLocale.title).toBe('get_locale');
    expect(getLocale.description).toBe(
      'Retrieve a specific locale from your Contentful environment',
    );
    expect(getLocale.inputParams).toStrictEqual(GetLocaleToolParams.shape);
    expect(getLocale.annotations).toEqual({
      readOnlyHint: true,
      openWorldHint: false,
    });
    expect(getLocale.tool).toBeDefined();
    expect(typeof getLocale.tool).toBe('function');
  });

  it('should have createLocale tool with correct properties', () => {
    const localeTools = createLocaleTools(mockConfig);
    const { createLocale } = localeTools;

    expect(createLocale.title).toBe('create_locale');
    expect(createLocale.inputParams).toStrictEqual(
      CreateLocaleToolParams.shape,
    );
    expect(createLocale.annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    });
    expect(createLocale.tool).toBeDefined();
    expect(typeof createLocale.tool).toBe('function');
  });

  it('should have listLocales tool with correct properties', () => {
    const localeTools = createLocaleTools(mockConfig);
    const { listLocales } = localeTools;

    expect(listLocales.title).toBe('list_locales');
    expect(listLocales.inputParams).toStrictEqual(ListLocaleToolParams.shape);
    expect(listLocales.annotations).toEqual({
      readOnlyHint: true,
      openWorldHint: false,
    });
    expect(listLocales.tool).toBeDefined();
    expect(typeof listLocales.tool).toBe('function');
  });

  it('should have updateLocale tool with correct properties', () => {
    const localeTools = createLocaleTools(mockConfig);
    const { updateLocale } = localeTools;

    expect(updateLocale.title).toBe('update_locale');
    expect(updateLocale.inputParams).toStrictEqual(
      UpdateLocaleToolParams.shape,
    );
    expect(updateLocale.annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    });
    expect(updateLocale.tool).toBeDefined();
    expect(typeof updateLocale.tool).toBe('function');
  });

  it('should have deleteLocale tool with correct properties', () => {
    const localeTools = createLocaleTools(mockConfig);
    const { deleteLocale } = localeTools;

    expect(deleteLocale.title).toBe('delete_locale');
    expect(deleteLocale.inputParams).toStrictEqual(
      DeleteLocaleToolParams.shape,
    );
    expect(deleteLocale.annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    });
    expect(deleteLocale.tool).toBeDefined();
    expect(typeof deleteLocale.tool).toBe('function');
  });
});
