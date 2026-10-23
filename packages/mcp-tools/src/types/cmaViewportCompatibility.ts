import type { z } from 'zod';
import type {
  DesignPropertyValueSchema,
  DimensionedDesignPropertyValueSchema,
} from './exoSchemas.js';

type DesignPropertyValue = z.infer<typeof DesignPropertyValueSchema>;
type DimensionedDesignPropertyValue = z.infer<
  typeof DimensionedDesignPropertyValueSchema
>;

// The SDK now models viewport-free component and template payloads directly.
export type ViewportOptionalPayload<Payload> = Payload;

/**
 * Viewport-free Experiences and Experience Fragments use flattened design
 * property values. The currently consumed CMA SDK only models their legacy,
 * dimensioned shape.
 */
export type ViewportOptionalPayloadWithFlattenedDesignProperties<Payload> =
  Omit<Payload, 'designProperties'> & {
    designProperties: Record<
      string,
      DesignPropertyValue | DimensionedDesignPropertyValue
    >;
  };

export function asViewportOptionalCmaPayload<Payload>(
  payload: Payload,
): Payload {
  return payload;
}

export function asViewportOptionalCmaPayloadWithFlattenedDesignProperties<
  Payload extends {
    designProperties: Record<string, unknown>;
  },
>(
  payload: ViewportOptionalPayloadWithFlattenedDesignProperties<Payload>,
): Payload {
  return payload as Payload;
}
