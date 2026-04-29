import { GoogleGenAI } from "@google/genai"
import { env } from "@/lib/env"
import { logger } from "@/lib/logger"
import type { Citation, LLMResult } from "./types"
import { extractBrands } from "./extract-brands"

let _genAI: GoogleGenAI | undefined
function getGenAI() {
  if (!_genAI) _genAI = new GoogleGenAI({ apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY })
  return _genAI
}

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
    const response = await getGenAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptText,
      config: {
        tools: [{ googleSearch: {} }],
        abortSignal: combined,
      },
    })

    if (combined.aborted) {
      throw new Error("Request aborted")
    }

    const durationMs = Date.now() - start
    const answerText = response.text ?? ""

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []
    const rawCitations: Citation[] = chunks
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

    const citations = await resolveProxyCitations(rawCitations)
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

async function resolveProxyCitations(citations: Citation[]): Promise<Citation[]> {
  return Promise.all(
    citations.map(async (c) => {
      if (!c.url.includes("vertexaisearch.cloud.google.com")) return c
      try {
        const res = await fetch(c.url, {
          method: "HEAD",
          redirect: "manual",
          signal: AbortSignal.timeout(4_000),
        })
        const location = res.headers.get("location")
        if (!location) return c
        return { url: location, domain: normalizeDomain(location), title: c.title }
      } catch {
        return c
      }
    })
  )
}

function deduplicateCitations(citations: Citation[]): Citation[] {
  const seen = new Set<string>()
  return citations.filter((c) => {
    if (seen.has(c.url)) return false
    seen.add(c.url)
    return true
  })
}
