import { createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export type ExoDisposition = 'exo' | 'classic' | 'empty';

/**
 * Classifies a space/environment as ExO-in-use, classic-in-use, or empty
 * based solely on Component Type presence (the foundational ExO primitive).
 * Returns undefined on any API error so callers can fail closed.
 */
export async function detectExoDisposition(
  config: ContentfulConfig,
  spaceId: string,
  environmentId: string,
): Promise<ExoDisposition | undefined> {
  try {
    const contentfulClient = createToolClient(config, {
      spaceId,
      environmentId,
    });

    const componentTypes = await contentfulClient.componentType.getMany({
      spaceId,
      environmentId,
      query: { limit: 1 },
    } as Parameters<typeof contentfulClient.componentType.getMany>[0]);

    if ((componentTypes.total ?? componentTypes.items.length) > 0) {
      return 'exo';
    }

    const contentTypes = await contentfulClient.contentType.getMany({
      spaceId,
      environmentId,
      query: { limit: 1 },
    });

    return (contentTypes.total ?? contentTypes.items.length) > 0
      ? 'classic'
      : 'empty';
  } catch (error) {
    console.error(
      `ExO detection failed for ${spaceId}:${environmentId}; falling back to classic-only tool registration.`,
      error,
    );
    return undefined;
  }
}
