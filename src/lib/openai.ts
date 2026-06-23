import OpenAI from "openai";

// maxRetries handles 429/5xx/timeout with exponential backoff automatically.
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 45000,
});

export const CHAT_MODEL = "gpt-4o";
export const TRANSCRIBE_MODEL = "whisper-1";

// JSON-only chat with a single retry on parse failure (per project rule).
export async function jsonChat<T>(
  system: string,
  user: string,
  opts?: { temperature?: number },
): Promise<T> {
  let lastText = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: opts?.temperature ?? 0.4,
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
