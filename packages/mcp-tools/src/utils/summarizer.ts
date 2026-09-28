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
      remaining: total - maxItems, // total spans the full collection, not just this page's items
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
 * Passes a cursor-paginated response through unchanged. Cursor responses
 * have no `total`, so unlike summarizeData() there's nothing to truncate:
 * the API already caps `items` at the requested `limit`, and continuation
 * is driven by `pages.next`/`pages.prev`, not by hiding items here.
 */
export const summarizeCursorData = (
  data: CursorPaginatedLike,
): Record<string, unknown> => data as unknown as Record<string, unknown>;
