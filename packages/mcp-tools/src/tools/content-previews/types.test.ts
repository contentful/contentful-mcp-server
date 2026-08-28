import { describe, it, expect } from 'vitest';
import {
  configurationContentTypeId,
  findEnabledConfiguration,
} from './types.js';
import { mockBlogPostPreview, mockLegacyPreview } from './mockClient.js';

describe('configurationContentTypeId', () => {
  it('prefers entityId for ContentType configurations', () => {
    expect(
      configurationContentTypeId({
        url: '',
        enabled: true,
        entityType: 'ContentType',
        entityId: 'blogPost',
        contentType: 'stale',
      }),
    ).toBe('blogPost');
  });

  it('falls back to the deprecated contentType field', () => {
    expect(
      configurationContentTypeId({
        url: '',
        enabled: true,
        contentType: 'blogPost',
      }),
    ).toBe('blogPost');
  });

  it('ignores non-content-type entities', () => {
    expect(
      configurationContentTypeId({
        url: '',
        enabled: true,
        entityType: 'ExperienceTemplate',
        entityId: 'layout',
      }),
    ).toBeUndefined();
  });
});

describe('findEnabledConfiguration', () => {
  it('returns the enabled configuration for a content type', () => {
    expect(
      findEnabledConfiguration(mockBlogPostPreview, 'blogPost')?.url,
    ).toContain('/blog/');
  });

  it('skips disabled configurations', () => {
    expect(
      findEnabledConfiguration(mockBlogPostPreview, 'landingPage'),
    ).toBeUndefined();
  });

  it('matches legacy configurations', () => {
    expect(
      findEnabledConfiguration(mockLegacyPreview, 'blogPost'),
    ).toBeDefined();
  });
});
