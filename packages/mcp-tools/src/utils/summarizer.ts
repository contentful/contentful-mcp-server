export interface SummarizeOptions {
  maxItems?: number;
  indent?: number;
  showTotal?: boolean;
  remainingMessage?: string;
}

export interface CursorPaginatedLike {
  items: unknown[];
  pages?: { next?: string; prev?: string };
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

export const DEFAULT_MAX_ITEMS = 3;

const DEFAULT_REMAINING_MESSAGE = offsetRemainingMessage('items');

/**
 * Shared truncation core: slices `items` to `maxItems` and builds the
 * showing/remaining/message fields common to both offset- and cursor-mode
 * summarization. Callers merge in whichever pagination fields (skip vs.
 * pages) apply to their response shape.
 */
function truncateItems(
  items: unknown[],
  maxItems: number,
  remainingMessage: string,
) {
  return {
    items: items.slice(0, maxItems),
    showing: maxItems,
    remaining: items.length - maxItems,
    message: remainingMessage,
  };
}

export const summarizeData = (
  data: unknown,
  options: SummarizeOptions = {},
): Record<string, unknown> | Array<unknown> => {
  const {
    maxItems = DEFAULT_MAX_ITEMS,
    remainingMessage = DEFAULT_REMAINING_MESSAGE,
  } = options;

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
      ...truncateItems(items, maxItems, remainingMessage),
      total,
      skip: maxItems, // Add skip value for next page
    };
  }

  // Handle plain arrays
  if (Array.isArray(data)) {
    if (data.length <= maxItems) {
      return data;
    }

    return {
      ...truncateItems(data, maxItems, remainingMessage),
      total: data.length,
      skip: maxItems, // Add skip value for next page
    };
  }

  // Return non-array data as-is (cast to expected return type)
  return data as Record<string, unknown>;
};

/**
 * Truncates a cursor-paginated response (no total/skip) for display, preserving
 * `pages` so callers can keep following pageNext/pagePrev instead of the skip
 * field summarizeData() attaches for offset-paginated responses.
 */
export const summarizeCursorData = (
  data: CursorPaginatedLike,
  options: Pick<SummarizeOptions, 'maxItems' | 'remainingMessage'> = {},
): Record<string, unknown> => {
  const {
    maxItems = DEFAULT_MAX_ITEMS,
    remainingMessage = CURSOR_REMAINING_MESSAGE,
  } = options;

  if (data.items.length <= maxItems) {
    return data as unknown as Record<string, unknown>;
  }

  return {
    ...data,
    ...truncateItems(data.items, maxItems, remainingMessage),
  };
};
