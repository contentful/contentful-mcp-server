import type { z } from 'zod';
import type {
  DesignPropertyValueSchema,
  DimensionedDesignPropertyValueSchema,
} from './exoSchemas.js';

type DesignPropertyValue = z.infer<typeof DesignPropertyValueSchema>;
type DimensionedDesignPropertyValue = z.infer<
  typeof DimensionedDesignPropertyValueSchema
>;

/**
 * Experiences and Experience Fragments use flattened design property values.
 * The currently consumed CMA SDK only models their legacy, dimensioned shape.
 */
export type PayloadWithFlattenedDesignProperties<Payload> = Omit<
  Payload,
  'designProperties'
> & {
  designProperties: Record<
    string,
    DesignPropertyValue | DimensionedDesignPropertyValue
  >;
};

export function asCmaPayloadWithFlattenedDesignProperties<
  Payload extends {
    designProperties: Record<string, unknown>;
  },
>(payload: PayloadWithFlattenedDesignProperties<Payload>): Payload {
  return payload as Payload;
}
