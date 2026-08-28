/**
 * `preview_environments` is a space-level CMA endpoint that is not exposed by
 * the `contentful-management` client yet, so it is reached through the plain
 * client's `raw` methods. Keeping the path in one place means there is a single
 * spot to update if the endpoint is restructured.
 *
 * See: https://contentful.atlassian.net/wiki/spaces/PROD/pages/4440785098
 */
export function previewEnvironmentsPath(spaceId: string): string {
  return `/spaces/${spaceId}/preview_environments`;
}
