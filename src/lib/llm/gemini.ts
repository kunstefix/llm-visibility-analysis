import { GoogleGenerativeAI } from "@google/generative-ai"
import { env } from "@/lib/env"
import { logger } from "@/lib/logger"
import type { Citation, LLMResult } from "./types"
import { extractBrands } from "./extract-brands"

const genAI = new GoogleGenerativeAI(env.GOOGLE_GENERATIVE_AI_API_KEY)

const LLM_TIMEOUT_MS = 30_000

function normalizeDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export async function queryGemini(
  promptText: string,
  signal: AbortSignal
): Promise<LLMResult> {
  const start = Date.now()

  const timeout = AbortSignal.timeout(LLM_TIMEOUT_MS)
  const combined = AbortSignal.any([signal, timeout])

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      tools: [{ googleSearchRetrieval: {} }],
    })

    const controller = new AbortController()
    const cleanup = () => controller.abort()
    combined.addEventListener("abort", cleanup, { once: true })

    let result
    try {
      result = await model.generateContent(promptText)
    } finally {
      combined.removeEventListener("abort", cleanup)
    }

    if (combined.aborted) {
      throw new Error("Request aborted")
    }

    const durationMs = Date.now() - start
    const response = result.response
    const answerText = response.text()

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []
    const citations: Citation[] = chunks
      .map((chunk) => {
        const web = chunk.web
        if (!web?.uri) return null
        return {
          url: web.uri,
          domain: normalizeDomain(web.uri),
          title: web.title ?? "",
        }
      })
      .filter((c): c is Citation => c !== null)

    const uniqueCitations = deduplicateCitations(citations)
    const brands = await extractBrands(answerText, signal)

    logger.info(
      {
        provider: "gemini",
        durationMs,
        citations: uniqueCitations.length,
        brands: brands.length,
      },
      "gemini query complete"
    )

    return {
      provider: "gemini",
      answerText,
      brands,
      citations: uniqueCitations,
      durationMs,
      rawResponse: response,
    }
  } catch (err) {
    const durationMs = Date.now() - start
    const errorMessage =
      err instanceof Error ? err.message : "Unknown Gemini error"
    logger.error({ provider: "gemini", durationMs, err }, "gemini query failed")
    return {
      provider: "gemini",
      answerText: "",
      brands: [],
      citations: [],
      durationMs,
      rawResponse: null,
      errorMessage,
    }
  }
}

function deduplicateCitations(citations: Citation[]): Citation[] {
  const seen = new Set<string>()
  return citations.filter((c) => {
    if (seen.has(c.url)) return false
    seen.add(c.url)
    return true
  })
}
