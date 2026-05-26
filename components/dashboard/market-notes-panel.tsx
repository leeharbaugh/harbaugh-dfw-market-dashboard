import type { MarketNotesRecord } from "@/lib/market-notes/types";

type MarketNotesPanelProps = {
  notes: MarketNotesRecord | null;
};

const FALLBACK_COPY =
  "Market notes will appear here after the next scheduled update.";

function formatGeneratedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

type Block =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string };

// The generator emits sections prefixed with `## ` followed by a short
// paragraph. We parse that lightweight format into typed blocks so the
// panel can render headings distinctly. Records saved before headings
// were introduced (no `## ` lines) still render correctly as a series
// of paragraphs.
function parseBlocks(notes: string): Block[] {
  const blocks: Block[] = [];
  const chunks = notes
    .split(/\n{2,}/)
    .map((c) => c.trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    const lines = chunk.split("\n");
    let buffer: string[] = [];

    const flushBuffer = () => {
      const text = buffer.join(" ").trim();
      if (text) blocks.push({ kind: "paragraph", text });
      buffer = [];
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.startsWith("## ")) {
        flushBuffer();
        blocks.push({ kind: "heading", text: line.slice(3).trim() });
      } else if (line) {
        buffer.push(line);
      }
    }
    flushBuffer();
  }

  return blocks;
}

export function MarketNotesPanel({ notes }: MarketNotesPanelProps) {
  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white/70 p-5 shadow-sm shadow-stone-900/[0.04] ring-1 ring-stone-900/[0.02] backdrop-blur-sm sm:p-6">
      {notes ? (
        <div>
          {parseBlocks(notes.notes).map((block, i) =>
            block.kind === "heading" ? (
              <h3
                key={i}
                className="mt-5 first:mt-0 text-sm font-semibold text-stone-700"
              >
                {block.text}
              </h3>
            ) : (
              <p
                key={i}
                className="mt-2 text-sm leading-relaxed text-stone-600"
              >
                {block.text}
              </p>
            ),
          )}
          <p className="mt-5 text-xs text-stone-400 tabular-nums">
            Generated {formatGeneratedAt(notes.generatedAt)}
          </p>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-stone-500">
          {FALLBACK_COPY}
        </p>
      )}
    </div>
  );
}
