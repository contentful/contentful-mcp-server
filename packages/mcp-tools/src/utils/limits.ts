export function searchLimit(userLimit?: number) {
  return Math.min(userLimit || 10, 1000);
}
