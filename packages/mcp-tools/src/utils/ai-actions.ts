import { z } from 'zod';

export enum VariableType {
  RESOURCE_LINK = 'ResourceLink',
  TEXT = 'Text',
  STANDARD_INPUT = 'StandardInput',
  LOCALE = 'Locale',
  MEDIA_REFERENCE = 'MediaReference',
  REFERENCE = 'Reference',
  SMART_CONTEXT = 'SmartContext',
}

export enum EntityType {
  ENTRY = 'Entry',
  ASSET = 'Asset',
  RESOURCE_LINK = 'ResourceLink',
}

// Create Zod schema for VariableValue
export const VariableValue = z.union([
  z.object({
    id: z.string(),
    value: z.string(),
  }),
  z.object({
    id: z.string(),
    value: z.object({
      entityType: z.nativeEnum(EntityType),
      entityId: z.string(),
      entityPath: z.string(),
    }),
  }),
  z.object({
    id: z.string(),
    value: z.object({
      entityType: z.literal(EntityType.ENTRY),
      entityId: z.string(),
      entityPaths: z.array(z.string()),
    }),
  }),
]);

export enum OutputFormat {
  RICH_TEXT = 'RichText',
  MARKDOWN = 'Markdown',
  PLAIN_TEXT = 'PlainText',
}

export type InvocationStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'FAILED'
  | 'COMPLETED'
  | 'CANCELLED';

// Define the shape we expect from the invocation status response
export interface InvocationStatusResponse {
  sys: {
    id: string;
    status: InvocationStatus;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
