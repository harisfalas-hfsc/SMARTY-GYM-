/**
 * Minimal streaming client for the Lovable AI Gateway Responses API, used by the
 * background SEO optimizer. Streaming (not buffered) so long runs never hit a
 * platform request timeout, and no client-side timers abort work in flight.
 */
const ENDPOINT = "https://ai.gateway.lovable.dev/v1/responses";
export const SEO_MODEL = "openai/gpt-5.6-sol";

export class AiTerminalError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AiTerminalError";
  }
}

export interface JsonSchemaSpec {
  name: string;
  schema: Record<string, unknown>;
}

/**
 * Sends one prompt and returns the parsed JSON object the model produced.
 * Throws AiTerminalError for terminal gateway statuses (400/401/402/403) and
 * for retryable ones (429/5xx) so the caller can decide how to park the work.
 */
export async function generateSeoJson<T>(args: {
  instructions: string;
  input: string;
  schema: JsonSchemaSpec;
  signal?: AbortSignal;
}): Promise<T> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiTerminalError("LOVABLE_API_KEY is not configured", 401);

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    ...(args.signal ? { signal: args.signal } : {}),
    body: JSON.stringify({
      model: SEO_MODEL,
      instructions: args.instructions,
      input: args.input,
      stream: true,
      reasoning: { effort: "low", summary: "auto" },
      text: {
        format: {
          type: "json_schema",
          name: args.schema.name,
          strict: true,
          schema: args.schema.schema,
        },
      },
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    throw new AiTerminalError(`AI gateway ${res.status}: ${body.slice(0, 300)}`, res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffered = "";
  let text = "";

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buffered += decoder.decode(chunk.value, { stream: true });
    const lines = buffered.split("\n");
    buffered = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
          text += event.delta;
        } else if (event.type === "response.completed" && event.response?.output_text) {
          if (!text) text = event.response.output_text;
        }
      } catch {
        // ignore keep-alive / partial frames
      }
    }
  }

  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  if (!cleaned) throw new AiTerminalError("AI returned an empty response", 502);
  return JSON.parse(cleaned) as T;
}
