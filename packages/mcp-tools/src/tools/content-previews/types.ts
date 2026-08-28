/**
 * Types and helpers for the Content Preview ("preview environment") CMA
 * endpoints.
 *
 * `preview_environments` is a space-level endpoint that is not yet part of the
 * official `contentful-management` client surface, so the response shapes are
 * declared here and the endpoint is called through the plain client's `raw`
 * methods. Keep these aligned with the CMA response if the endpoint changes.
 */

/** Entity kinds a preview configuration can be attached to. */
export type PreviewEnvironmentEntityType =
  | 'ContentType'
  | 'ExperienceTemplate'
  | 'Component'
  | 'ExperienceTemplate:Definition'
  | 'Component:Definition'
  /** @deprecated superseded by `ExperienceTemplate` */
  | 'Template'
  /** @deprecated superseded by `Component` */
  | 'ComponentType';

export type PreviewEnvironmentConfiguration = {
  /** URL template, e.g. `https://example.com/{locale}/{entry.fields.slug}?secret=abc`. */
  url: string;
  entityType?: PreviewEnvironmentEntityType;
  entityId?: string;
  /** @deprecated superseded by `entityType` + `entityId`; still returned by the CMA. */
  contentType?: string | null;
  enabled: boolean;
  example?: boolean;
};

export type PreviewEnvironment = {
  sys: {
    id: string;
    type: 'PreviewEnvironment';
    version: number;
    createdAt: string;
    updatedAt: string;
    space: { sys: { id: string; type: 'Link'; linkType: 'Space' } };
  };
  name: string;
  description?: string;
  configurations: PreviewEnvironmentConfiguration[];
};

/**
 * Resolves the content type a configuration targets.
 *
 * Newer configurations use `entityType`/`entityId`; older ones only carry the
 * deprecated `contentType`. Non-content-type entities (ExO templates and
 * components) return `undefined` so callers can skip them.
 */
export function configurationContentTypeId(
  configuration: PreviewEnvironmentConfiguration,
): string | undefined {
  if (configuration.entityType && configuration.entityType !== 'ContentType') {
    return undefined;
  }

  return configuration.entityId ?? configuration.contentType ?? undefined;
}

/** Returns the enabled configuration for `contentTypeId`, if the preview has one. */
export function findEnabledConfiguration(
  previewEnvironment: PreviewEnvironment,
  contentTypeId: string,
): PreviewEnvironmentConfiguration | undefined {
  return previewEnvironment.configurations.find(
    (configuration) =>
      configuration.enabled &&
      configurationContentTypeId(configuration) === contentTypeId,
  );
}
