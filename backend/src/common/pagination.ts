export function normalizePage(page: string | undefined): number {
  return Math.max(parseInt(page ?? '0', 10) || 0, 0);
}

export function normalizeLimit(limit: string | undefined, defaultLimit = 10, minLimit = 10, maxLimit = 100): number {
  const parsed = parseInt(limit ?? '', 10);
  const value = Number.isNaN(parsed) ? defaultLimit : parsed;
  return Math.min(Math.max(value, minLimit), maxLimit);
}
