import { env } from "../../lib/env.js";

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmCompletionResult {
  usedExternalLlm: boolean;
  provider: string;
  model: string;
  content: string;
}

export function isLlmConfigured(): boolean {
  return Boolean(env.llmApiKey && env.llmApiKey.trim().length > 8);
}

/**
 * Isolated LLM adapter. Reads server-side API credentials only and safely
 * returns null if no API key is configured or the upstream call fails, so
 * callers can serve deterministic market-doc grounded analysis.
 */
export async function generateLlmText(
  messages: LlmMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<LlmCompletionResult | null> {
  if (!isLlmConfigured()) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    if (env.aiProvider.toLowerCase() === "gemini") {
      const systemInstruction = messages
        .filter((m) => m.role === "system")
        .map((m) => m.content)
        .join("\n\n");
      const contents = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      const modelName = env.llmModel || "gemini-2.0-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        modelName
      )}:generateContent?key=${encodeURIComponent(env.llmApiKey)}`;

      const resp = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(systemInstruction
            ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
            : {}),
          contents,
          generationConfig: {
            temperature: options?.temperature ?? 0.3,
            maxOutputTokens: options?.maxTokens ?? 900,
          },
        }),
      });

      if (!resp.ok) {
        console.warn(`[LLM] Gemini API returned HTTP ${resp.status}`);
        return null;
      }

      const json = (await resp.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
      if (!text.trim()) return null;

      return {
        usedExternalLlm: true,
        provider: "gemini",
        model: modelName,
        content: text.trim(),
      };
    }

    // Default: OpenAI / OpenAI-compatible Chat Completions endpoint
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.llmApiKey}`,
      },
      body: JSON.stringify({
        model: env.llmModel || "gpt-4o-mini",
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 900,
        messages,
      }),
    });

    if (!resp.ok) {
      console.warn(`[LLM] OpenAI API returned HTTP ${resp.status}`);
      return null;
    }

    const json = (await resp.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content?.trim() || "";
    if (!text) return null;

    return {
      usedExternalLlm: true,
      provider: env.aiProvider || "openai",
      model: env.llmModel || "gpt-4o-mini",
      content: text,
    };
  } catch (err) {
    console.warn(
      "[LLM] External completion failed; falling back to market-doc analyzer:",
      err instanceof Error ? err.message : "unknown error"
    );
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
