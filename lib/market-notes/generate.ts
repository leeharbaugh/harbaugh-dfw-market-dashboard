import "server-only";

import type { DashboardBundle } from "@/lib/dfw-dashboard-sample-data";
import { sanitizeMarketNotesHints } from "@/lib/market-notes/hints";
import { buildMarketNotesGrounding } from "@/lib/market-notes/grounding";
import {
  getOpenAIModel,
  openAIChatCompletion,
} from "@/lib/market-notes/openai";
import type { MarketNotesRecord } from "@/lib/market-notes/types";

export type GenerateMarketNotesOptions = {
  source?: MarketNotesRecord["source"];
  hints?: string | null;
};

/**
 * Server-side helper that produces a fresh Market Notes record from the
 * current dashboard data. Callers are responsible for persisting the
 * returned record via the storage adapter (see `lib/market-notes/storage.ts`).
 *
 * IMPORTANT: This function calls OpenAI. It must NEVER run on page load
 * or as part of a normal "Refresh Data" action. The only callers should
 * be (1) the protected manual API route and (2) the monthly cron job
 * that runs after TRERC publishes new monthly data.
 */
export async function generateMarketNotes(
  data: DashboardBundle,
  options: GenerateMarketNotesOptions = {},
): Promise<MarketNotesRecord> {
  const hints = sanitizeMarketNotesHints(options.hints);
  const grounding = buildMarketNotesGrounding(data);

  const systemPrompt = [
    "You are a calm, professional real-estate market analyst writing brief",
    "context notes for a public DFW housing dashboard. Your audience is",
    "homeowners, prospective buyers, and curious local readers.",
    "",
    "OUTPUT STRUCTURE",
    "Produce exactly four sections, in this order. Each section begins with",
    "a heading on its own line that starts with two hash marks and a space,",
    "followed by a blank line, followed by one short paragraph (2-4",
    "sentences). Use these exact heading strings — no others:",
    "",
    "## National Economic Backdrop",
    "## DFW Market Summary",
    "## Arlington Housing Market",
    "## Mansfield Housing Market",
    "",
    "SECTION CONTENT",
    "Pull each section only from the metrics named below, and only when",
    "they appear in the GROUNDING DATA. If a particular metric is not in",
    "the grounding data, omit it — do not mention that it is missing.",
    "",
    "- National Economic Backdrop: 30-year mortgage rate, 10-year Treasury,",
    "  mortgage / Treasury spread, Fed funds rate, CPI inflation,",
    "  unemployment, GDP, national debt, M2 money supply, national",
    "  Case-Shiller, and U.S. household income.",
    "- DFW Market Summary: DFW median sale price, DFW months of",
    "  inventory / supply, DFW home sales volume, DFW Case-Shiller, DFW",
    "  CPI, and Texas / DFW labor and price metrics when they meaningfully",
    "  inform the local read.",
    "- Arlington Housing Market: Arlington median sale price and Arlington",
    "  months of inventory / supply.",
    "- Mansfield Housing Market: Mansfield median sale price and Mansfield",
    "  months of inventory / supply.",
    "",
    "EDITORIAL GUIDANCE",
    "When editorial guidance from Lee Harbaugh is provided in the user",
    "message, treat it as stylistic and editorial direction — NOT as",
    "factual data.",
    "- Follow the guidance when it is consistent with the GROUNDING DATA.",
    "- Ignore guidance that contradicts the figures in GROUNDING DATA.",
    "- Never invent numbers, percentages, or dates to satisfy the guidance.",
    "- All factual claims must still come only from GROUNDING DATA.",
    "",
    "STRICT RULES",
    "- Use ONLY figures present in the GROUNDING DATA. Do not invent",
    "  numbers, sources, dates, neighborhoods, or causes.",
    "- Calm, neutral, professional tone. No hype, no fear, no urgency, no",
    "  exclamation points, no marketing language.",
    "- No financial, investment, or purchase advice. No predictions about",
    "  the Fed or future rate moves. You may describe recent direction",
    "  only when it is directly supported by the provided figures.",
    "- Plain text only. The only formatting allowed is the four `##`",
    "  headings listed above. No bullet points, no other markdown, no",
    "  emojis, no source citations.",
    "- Keep each paragraph short. The full summary should remain easy to",
    "  read at a glance.",
  ].join("\n");

  const userPromptParts = [
    `Today's date (UTC): ${new Date().toISOString().slice(0, 10)}.`,
    "",
    "GROUNDING DATA (latest dashboard figures — the only facts you may use):",
    "",
    grounding,
  ];

  if (hints) {
    userPromptParts.push(
      "",
      "Editorial guidance from Lee Harbaugh",
      hints,
    );
  }

  userPromptParts.push(
    "",
    "Write the Market Notes now, following all rules in the system message.",
  );

  const userPrompt = userPromptParts.join("\n");

  const result = await openAIChatCompletion({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    model: getOpenAIModel(),
    temperature: 0.4,
    maxOutputTokens: 600,
  });

  return {
    notes: normalizeNotes(result.text),
    generatedAt: new Date().toISOString(),
    model: result.model,
    source: options.source ?? "manual",
    hintsUsed: hints,
    version: 1,
  };
}

/**
 * Light cleanup so stored output is consistent regardless of small
 * model formatting quirks. We intentionally do NOT try to rewrite or
 * sanitize the model's word choices — the system prompt is the
 * single source of truth for style and safety.
 */
function normalizeNotes(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
