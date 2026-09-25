import type { ComponentTypeViewport } from 'contentful-management';
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
 * The CMA supports viewport-free ExO entities, but the currently consumed CMA
 * SDK version still marks `viewports` as required. Keep the exception local to
 * the SDK call boundary while callers validate the rest of the payload with
 * `satisfies`.
 */
export type ViewportOptionalPayload<Payload> = Omit<Payload, 'viewports'> & {
  viewports?: ComponentTypeViewport[];
};

/**
 * Viewport-free Experiences and Experience Fragments use flattened design
 * property values. The currently consumed CMA SDK only models their legacy,
 * dimensioned shape.
 */
export type ViewportOptionalPayloadWithFlattenedDesignProperties<Payload> =
  Omit<Payload, 'viewports' | 'designProperties'> & {
    viewports?: ComponentTypeViewport[];
    designProperties: Record<
      string,
      DesignPropertyValue | DimensionedDesignPropertyValue
    >;
  };

export function asViewportOptionalCmaPayload<
  Payload extends { viewports?: ComponentTypeViewport[] },
>(payload: ViewportOptionalPayload<Payload>): Payload {
  return payload as Payload;
}

export function asViewportOptionalCmaPayloadWithFlattenedDesignProperties<
  Payload extends {
    viewports?: ComponentTypeViewport[];
    designProperties: Record<string, unknown>;
  },
>(
  payload: ViewportOptionalPayloadWithFlattenedDesignProperties<Payload>,
): Payload {
  return payload as Payload;
}
