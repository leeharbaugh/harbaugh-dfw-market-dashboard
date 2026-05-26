import "server-only";

/**
 * Minimal server-side OpenAI client used only by the Market Notes
 * generator. Server-only by design — the OPENAI_API_KEY must never
 * be exposed to the browser. We use raw `fetch` against the
 * Chat Completions endpoint to avoid pulling in an SDK dependency.
 */

const OPENAI_CHAT_COMPLETIONS_URL =
  "https://api.openai.com/v1/chat/completions";

const DEFAULT_MODEL = "gpt-4o-mini";

export class OpenAIConfigError extends Error {
  constructor(message = "OPENAI_API_KEY is not configured") {
    super(message);
    this.name = "OpenAIConfigError";
  }
}

export class OpenAIRequestError extends Error {
  readonly status?: number;
  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message);
    this.name = "OpenAIRequestError";
    this.status = options?.status;
    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export type OpenAIChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenAIChatRequest = {
  messages: OpenAIChatMessage[];
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
};

export type OpenAIChatResult = {
  text: string;
  model: string;
};

type ChatCompletionsResponse = {
  model?: string;
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}

export async function openAIChatCompletion(
  request: OpenAIChatRequest,
): Promise<OpenAIChatResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new OpenAIConfigError();
  }

  const model = request.model ?? getOpenAIModel();

  let response: Response;
  try {
    response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.4,
        max_tokens: request.maxOutputTokens ?? 600,
      }),
      cache: "no-store",
    });
  } catch (cause) {
    throw new OpenAIRequestError("Network error calling OpenAI", { cause });
  }

  let body: ChatCompletionsResponse;
  try {
    body = (await response.json()) as ChatCompletionsResponse;
  } catch (cause) {
    throw new OpenAIRequestError("Invalid JSON from OpenAI", {
      status: response.status,
      cause,
    });
  }

  if (!response.ok) {
    throw new OpenAIRequestError(
      body.error?.message ?? `OpenAI returned ${response.status}`,
      { status: response.status },
    );
  }

  const text = body.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new OpenAIRequestError("OpenAI returned an empty completion");
  }

  return { text, model: body.model ?? model };
}
