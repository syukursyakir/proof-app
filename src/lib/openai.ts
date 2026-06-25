import OpenAI from "openai";

// maxRetries handles 429/5xx/timeout with exponential backoff automatically.
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 45000,
});

// gpt-4o (and the o-series) are retired; gpt-5.4 is the current balanced model.
export const CHAT_MODEL = "gpt-5.4";
export const TRANSCRIBE_MODEL = "whisper-1";

// `reasoningEffort` support kept for future use, but deliberately NOT used for
// MCQ generation: live-tested gpt-5.5 + reasoning_effort "medium"/"high" against
// plain gpt-5.4 with no reasoning_effort (just the reasoning-field-in-schema
// trick — see buildMcqBatchSystem). Reasoning effort cost 15-25x more ($0.20-
// 0.37 vs $0.05) and took 4-12x longer (63-183s vs 15s) for comparable item
// quality on manual inspection — the schema trick alone already captures most
// of the benefit. Verified directly against the API: reasoning_effort != "none"
// rejects the temperature param outright (400), so calls using it must omit it.
type ReasoningEffort = "none" | "low" | "medium" | "high" | "xhigh";

// JSON-only chat with a single retry on parse failure (per project rule).
export async function jsonChat<T>(
  system: string,
  user: string,
  opts?: { temperature?: number; model?: string; reasoningEffort?: ReasoningEffort },
): Promise<T> {
  const model = opts?.model ?? CHAT_MODEL;
  const reasoningEffort = opts?.reasoningEffort;
  let lastText = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      // temperature is rejected outright by reasoning models once effort != "none".
      ...(reasoningEffort && reasoningEffort !== "none"
        ? { reasoning_effort: reasoningEffort }
        : { temperature: opts?.temperature ?? 0.4 }),
    });
    lastText = res.choices[0]?.message?.content ?? "";
    try {
      return JSON.parse(lastText) as T;
    } catch {
      // retry once
    }
  }
  throw new Error("OpenAI returned invalid JSON: " + lastText.slice(0, 300));
}
