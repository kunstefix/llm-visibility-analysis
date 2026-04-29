import OpenAI from "openai"
import { env } from "@/lib/env"
import { logger } from "@/lib/logger"
import type { Citation, LLMResult } from "./types"
import { extractBrands } from "./extract-brands"

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY })

const LLM_TIMEOUT_MS = 30_000

function normalizeDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export async function queryOpenAI(
  promptText: string,
  signal: AbortSignal
): Promise<LLMResult> {
  const start = Date.now()

  const timeout = AbortSignal.timeout(LLM_TIMEOUT_MS)
  const combined = AbortSignal.any([signal, timeout])

  try {
    const res = await client.responses.create(
      {
        model: "gpt-4o",
        tools: [{ type: "web_search" }],
        input: promptText,
      },
      { signal: combined }
    )

    const durationMs = Date.now() - start
    const answerText = res.output_text ?? ""

    const citations: Citation[] = []
    for (const item of res.output ?? []) {
      if (item.type === "message") {
        for (const part of item.content ?? []) {
          if (part.type === "output_text") {
            for (const ann of part.annotations ?? []) {
              if (ann.type === "url_citation") {
                const url = ann.url
                citations.push({
                  url,
                  domain: normalizeDomain(url),
                  title: ann.title ?? "",
                })
              }
            }
          }
        }
      }
    }

    const uniqueCitations = deduplicateCitations(citations)
    const brands = await extractBrands(answerText, signal)

    logger.info(
      {
        provider: "openai",
        durationMs,
        inputTokens: res.usage?.input_tokens,
        outputTokens: res.usage?.output_tokens,
        citations: uniqueCitations.length,
        brands: brands.length,
      },
      "openai query complete"
    )

    return {
      provider: "openai",
      answerText,
      brands,
      citations: uniqueCitations,
      durationMs,
      rawResponse: res,
    }
  } catch (err) {
    const durationMs = Date.now() - start
    const errorMessage =
      err instanceof Error ? err.message : "Unknown OpenAI error"
    logger.error({ provider: "openai", durationMs, err }, "openai query failed")
    return {
      provider: "openai",
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
