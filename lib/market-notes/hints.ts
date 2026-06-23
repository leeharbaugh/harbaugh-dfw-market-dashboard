import "server-only";

export const MAX_MARKET_NOTES_HINTS_LENGTH = 1000;

/**
 * Normalize optional editorial hints from a manual generation request.
 * Returns null when absent or blank after trimming.
 */
export function sanitizeMarketNotesHints(
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.length > MAX_MARKET_NOTES_HINTS_LENGTH
    ? trimmed.slice(0, MAX_MARKET_NOTES_HINTS_LENGTH)
    : trimmed;
}

/** Avoid logging full hint text in production. */
export function formatHintsForLog(hints: string | null): string {
  if (!hints) return "none";
  if (process.env.NODE_ENV === "production") {
    return `${hints.length} chars`;
  }
  if (hints.length <= 80) return hints;
  return `${hints.slice(0, 80)}… (${hints.length} chars)`;
}
