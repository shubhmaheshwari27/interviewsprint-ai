import Anthropic from "@anthropic-ai/sdk"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { GoogleGenAI } from "@google/genai"
import OpenAI from "openai"
import { AnalysisJsonShape, parseAIResponse, AnalysisSchema, type Analysis } from "@/lib/ai/analysis"

/**
 * Bring-your-own-key AI providers. Each adapter uses the provider's official
 * SDK, a timeout and a single retry, and returns an analysis validated against
 * the same Zod schema, so callers can swap providers freely.
 */

export type ProviderId = "GOOGLE" | "OPENAI" | "ANTHROPIC"

export const PROVIDERS: Record<
  ProviderId,
  { label: string; keyUrl: string; defaultModel: string; models: { id: string; label: string }[]; note: string }
> = {
  GOOGLE: {
    label: "Google Gemini",
    keyUrl: "https://aistudio.google.com/apikey",
    defaultModel: "gemini-2.5-flash",
    models: [
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (free tier)" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    ],
    note: "Free API keys with a daily free quota.",
  },
  OPENAI: {
    label: "OpenAI (GPT)",
    keyUrl: "https://platform.openai.com/api-keys",
    defaultModel: "gpt-4.1-mini",
    models: [
      { id: "gpt-4.1-mini", label: "GPT-4.1 mini" },
      { id: "gpt-4.1", label: "GPT-4.1" },
    ],
    note: "Paid: needs prepaid API credits.",
  },
  ANTHROPIC: {
    label: "Anthropic (Claude)",
    keyUrl: "https://platform.claude.com/settings/keys",
    defaultModel: "claude-opus-5-5",
    models: [
      { id: "claude-opus-5-5", label: "Claude Opus 5.5" },
      { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5" },
      { id: "claude-haiku-5-5", label: "Claude Haiku 5.5" },
    ],
    note: "Paid: needs prepaid API credits.",
  },
}

export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[]
export const PROVIDER_TIMEOUT_MS = 45_000

const SYSTEM = "You are an expert career coach and technical recruiter. Respond only with JSON that matches the requested format."

export type GenerationResult = { analysis: Analysis; tokens: number | null }

/** Error with a message that is safe to show the user (never contains the key). */
export class ProviderError extends Error {
  constructor(message: string, readonly retryable: boolean) {
    super(message)
  }
}

export function describeProviderError(error: any): ProviderError {
  if (error instanceof ProviderError) return error
  const status: number | undefined = error?.status ?? error?.code
  const message = String(error?.message ?? "").toLowerCase()
  if (status === 401 || status === 403 || message.includes("api key not valid") || message.includes("invalid api key"))
    return new ProviderError("The key was rejected. Check that it is correct and active.", false)
  if (status === 429 || message.includes("quota") || message.includes("rate limit"))
    return new ProviderError("Rate limit or quota reached (or no credits left).", true)
  if (status === 404 || message.includes("not found"))
    return new ProviderError("That model is not available for this key.", false)
  if (message.includes("timeout") || message.includes("timed out") || error?.name === "AbortError")
    return new ProviderError("The provider took too long to answer.", true)
  if (error?.name === "ZodError" || error instanceof SyntaxError)
    return new ProviderError("The provider returned an unusable answer.", true)
  if (typeof status === "number" && status >= 500) return new ProviderError("The provider is having problems.", true)
  return new ProviderError("The provider request failed.", true)
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new ProviderError("The provider took too long to answer.", true)), ms)
    promise.then(
      (v) => (clearTimeout(timer), resolve(v)),
      (e) => (clearTimeout(timer), reject(e))
    )
  })
}

async function generateOpenAI(apiKey: string, model: string, prompt: string): Promise<GenerationResult> {
  const client = new OpenAI({ apiKey, timeout: PROVIDER_TIMEOUT_MS, maxRetries: 1 })
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  })
  return {
    analysis: parseAIResponse(response.choices[0]?.message?.content),
    tokens: response.usage?.total_tokens ?? null,
  }
}

async function generateAnthropic(apiKey: string, model: string, prompt: string): Promise<GenerationResult> {
  const client = new Anthropic({ apiKey, timeout: PROVIDER_TIMEOUT_MS, maxRetries: 1 })
  const response = await client.messages.parse({
    model,
    max_tokens: 16000,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
    output_config: { format: zodOutputFormat(AnalysisJsonShape) },
  })
  if (response.stop_reason === "refusal") throw new ProviderError("The model declined this request.", false)
  if (!response.parsed_output) throw new ProviderError("The provider returned an unusable answer.", true)
  return {
    analysis: AnalysisSchema.parse(response.parsed_output),
    tokens: response.usage.input_tokens + response.usage.output_tokens,
  }
}

async function generateGemini(apiKey: string, model: string, prompt: string): Promise<GenerationResult> {
  const ai = new GoogleGenAI({ apiKey })
  const response = await withTimeout(
    ai.models.generateContent({
      model,
      contents: prompt,
      config: { systemInstruction: SYSTEM, responseMimeType: "application/json" },
    }),
    PROVIDER_TIMEOUT_MS
  )
  return { analysis: parseAIResponse(response.text), tokens: response.usageMetadata?.totalTokenCount ?? null }
}

export async function generateWithProvider(
  provider: ProviderId,
  apiKey: string,
  model: string,
  prompt: string
): Promise<GenerationResult> {
  try {
    if (provider === "OPENAI") return await generateOpenAI(apiKey, model, prompt)
    if (provider === "ANTHROPIC") return await generateAnthropic(apiKey, model, prompt)
    return await generateGemini(apiKey, model, prompt)
  } catch (error) {
    throw describeProviderError(error)
  }
}

/** Cheap check that a key works: lists models (no tokens used). */
export async function testProviderKey(provider: ProviderId, apiKey: string): Promise<{ ok: boolean; message: string }> {
  try {
    if (provider === "OPENAI") {
      await new OpenAI({ apiKey, timeout: 15_000, maxRetries: 0 }).models.list()
    } else if (provider === "ANTHROPIC") {
      await new Anthropic({ apiKey, timeout: 15_000, maxRetries: 0 }).models.list({ limit: 1 })
    } else {
      await withTimeout(new GoogleGenAI({ apiKey }).models.list({ config: { pageSize: 1 } }), 15_000)
    }
    return { ok: true, message: "Connected" }
  } catch (error) {
    return { ok: false, message: describeProviderError(error).message }
  }
}
