import { z } from 'zod';

export const ReleaseEntityLinkSchema = z.object({
  id: z.string().describe('The ID of the Entry or Asset'),
  linkType: z
    .enum(['Entry', 'Asset'])
    .describe('The type of entity being linked'),
});

type ReleaseEntityLink = z.infer<typeof ReleaseEntityLinkSchema>;

export function createReleaseEntities(entities: ReleaseEntityLink[]) {
  return {
    sys: { type: 'Array' as const },
    items: entities.map((entity) => ({
      sys: {
        type: 'Link' as const,
        linkType: entity.linkType,
        id: entity.id,
      },
    })),
  };
}
