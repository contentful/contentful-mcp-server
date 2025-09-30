export interface SummarizeOptions {
  maxItems?: number;
  indent?: number;
  showTotal?: boolean;
  remainingMessage?: string;
}

export const summarizeData = (
  data: unknown,
  options: SummarizeOptions = {},
): Record<string, unknown> | Array<unknown> => {
  const {
    maxItems = 3,
    remainingMessage = 'To see more items, please ask me to retrieve the next page.',
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
