export interface SummarizeOptions {
  maxItems?: number;
  indent?: number;
  showTotal?: boolean;
  remainingMessage?: string;
}

/**
 * Guidance shown when an offset-paginated response is truncated. Kept as a
 * shared template so the cursor-pagination steer can't drift between tools.
 */
export function offsetRemainingMessage(itemLabel: string): string {
  return `To see more ${itemLabel}, please ask me to retrieve the next page. If you need the entire collection, ask me to use cursor pagination (cursor: true) instead of repeatedly increasing skip.`;
}

/** Guidance shown when a cursor-paginated response is truncated. */
export const CURSOR_REMAINING_MESSAGE =
  'To retrieve the full collection, ask me to continue with cursor pagination (cursor: true) using the pageNext token, rather than repeatedly increasing skip.';

const DEFAULT_REMAINING_MESSAGE = offsetRemainingMessage('items');

export const summarizeData = (
  data: unknown,
  options: SummarizeOptions = {},
): Record<string, unknown> | Array<unknown> => {
  const { maxItems = 3, remainingMessage = DEFAULT_REMAINING_MESSAGE } =
    options;

  // Handle Contentful-style responses with items and total
  if (data && typeof data === 'object' && 'items' in data && 'total' in data) {
    const items = data.items;
    const total = data.total;

    // Type guard to ensure items is an array and total is a number
    if (!Array.isArray(items) || typeof total !== 'number') {
      return data as Record<string, unknown>;
    }

    if (items.length <= maxItems) {
      return data as Record<string, unknown>;
    }

    return {
      items: items.slice(0, maxItems),
      total: total,
      showing: maxItems,
      remaining: total - maxItems,
      message: remainingMessage,
      skip: maxItems, // Add skip value for next page
    };
  }

  // Handle plain arrays
  if (Array.isArray(data)) {
    if (data.length <= maxItems) {
      return data;
    }

    return {
      items: data.slice(0, maxItems),
      total: data.length,
      showing: maxItems,
      remaining: data.length - maxItems,
      message: remainingMessage,
      skip: maxItems, // Add skip value for next page
    };
  }

  // Return non-array data as-is (cast to expected return type)
  return data as Record<string, unknown>;
};
