import { describe, it, expect } from 'vitest';
import { localeTools } from './register.js';
import { getLocaleTool, GetLocaleToolParams } from './getLocale.js';
import { createLocaleTool, CreateLocaleToolParams } from './createLocale.js';
import { listLocaleTool, ListLocaleToolParams } from './listLocales.js';
import { updateLocaleTool, UpdateLocaleToolParams } from './updateLocale.js';
import { deleteLocaleTool, DeleteLocaleToolParams } from './deleteLocale.js';

describe('locale tools collection', () => {
  it('should export localeTools collection with correct structure', () => {
    expect(localeTools).toBeDefined();
    expect(Object.keys(localeTools)).toHaveLength(5);
  });

  it('should have getLocale tool with correct properties', () => {
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
    expect(getLocale.tool).toBe(getLocaleTool);
  });

  it('should have createLocale tool with correct properties', () => {
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
    expect(createLocale.tool).toBe(createLocaleTool);
  });

  it('should have listLocales tool with correct properties', () => {
    const { listLocales } = localeTools;

    expect(listLocales.title).toBe('list_locales');
    expect(listLocales.inputParams).toStrictEqual(ListLocaleToolParams.shape);
    expect(listLocales.annotations).toEqual({
      readOnlyHint: true,
      openWorldHint: false,
    });
    expect(listLocales.tool).toBe(listLocaleTool);
  });

  it('should have updateLocale tool with correct properties', () => {
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
    expect(updateLocale.tool).toBe(updateLocaleTool);
  });

  it('should have deleteLocale tool with correct properties', () => {
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
    expect(deleteLocale.tool).toBe(deleteLocaleTool);
  });
});
