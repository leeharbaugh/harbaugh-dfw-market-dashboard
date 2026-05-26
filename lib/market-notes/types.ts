/**
 * Shared types for the global "Market Notes" feature.
 *
 * Market Notes are AI-generated narrative paragraphs about the current
 * state of the DFW housing market. They are intentionally generated
 * GLOBALLY (one document, shared by all dashboard visitors) rather than
 * per-user, and only by an out-of-band scheduled / manual job — never on
 * page load or normal Refresh Data.
 *
 * See `lib/market-notes/generate.ts` for the generator and
 * `lib/market-notes/storage.ts` for the shared storage adapter.
 */

export type MarketNotesRecord = {
  /** Plain text, 2-4 short calm professional paragraphs separated by blank lines. */
  notes: string;
  /** ISO timestamp the notes were generated (UTC). */
  generatedAt: string;
  /** Model identifier used to generate the notes. */
  model: string;
  /** Short label describing how generation was triggered. */
  source: "scheduled" | "manual";
  /** Schema version, to allow safe evolution of stored records. */
  version: 1;
};
