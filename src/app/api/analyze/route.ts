import { type NextRequest } from "next/server"
import { UrlInputSchema } from "@/lib/validation"
import { scrapeUrl } from "@/lib/scrape"
import { generatePrompts } from "@/lib/prompts/generate"
import { queryOpenAI } from "@/lib/llm/openai"
import { queryGemini } from "@/lib/llm/gemini"
import { hashIp } from "@/lib/rate-limit"
import {
  insertReport,
  insertPrompts,
  insertPromptResult,
} from "@/lib/db/queries"
import { logger } from "@/lib/logger"
import type { LLMResult } from "@/lib/llm/types"
import type { GeneratedPrompt } from "@/lib/prompts/generate"
import type { ScrapedContext } from "@/lib/scrape"

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  "X-Accel-Buffering": "no",
  Connection: "keep-alive",
}

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

function heartbeat(): string {
  return `: ping\n\n`
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const parsed = UrlInputSchema.safeParse(body?.url)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid URL" },
      { status: 400 }
    )
  }

  const url = parsed.data
  const ip = getIp(req)
  const ipHash = hashIp(ip)

  // Rate limiting disabled
  // const rateLimited = await isRateLimited(ip).catch(() => false)
  // if (rateLimited) {
  //   return Response.json(
  //     { error: "Rate limit exceeded. You can run 3 analyses per day." },
  //     { status: 429 }
  //   )
  // }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(new TextEncoder().encode(sseEvent(data)))
        } catch {
          // client disconnected
        }
      }

      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(heartbeat()))
        } catch {
          clearInterval(heartbeatInterval)
        }
      }, 15_000)

      try {
        send({ type: "stage", stage: "scraping" })

        let context: ScrapedContext
        try {
          context = await scrapeUrl(url, req.signal)
        } catch (err) {
          send({
            type: "error",
            message:
              err instanceof Error
                ? err.message
                : "Failed to scrape the URL",
          })
          return
        }

        send({ type: "stage", stage: "generating_prompts" })

        let generatedPrompts: GeneratedPrompt[]
        try {
          generatedPrompts = await generatePrompts(context, req.signal)
        } catch (err) {
          send({
            type: "error",
            message:
              err instanceof Error
                ? err.message
                : "Failed to generate prompts",
          })
          return
        }

        send({ type: "prompts", prompts: generatedPrompts })
        send({ type: "stage", stage: "querying_llms" })

        // Run all 10 LLM calls in parallel
        const llmTasks = generatedPrompts.flatMap((prompt, i) => [
          queryOpenAI(prompt.text, req.signal).then((result) => ({
            promptIndex: i,
            result,
          })),
          queryGemini(prompt.text, req.signal).then((result) => ({
            promptIndex: i,
            result,
          })),
        ])

        const llmResults: { promptIndex: number; result: LLMResult }[] = []

        await Promise.allSettled(
          llmTasks.map((task) =>
            task.then(({ promptIndex, result }) => {
              llmResults.push({ promptIndex, result })
              send({ type: "prompt-complete", promptIndex, result })
            })
          )
        )

        send({ type: "stage", stage: "aggregating" })

        // Check if all calls failed
        const allFailed = llmResults.every((r) => r.result.errorMessage)
        if (allFailed) {
          send({
            type: "error",
            message: "All LLM calls failed. Please try again.",
          })
          return
        }

        // Persist to DB
        try {
          const reportId = await insertReport({
            url,
            domain: context.domain,
            brandName: context.brandName,
            scrapedContext: context,
            status: "completed",
            ipHash,
          })

          const promptIds = await insertPrompts(reportId, generatedPrompts)

          await Promise.allSettled(
            llmResults.map(({ promptIndex, result }) => {
              const promptId = promptIds[promptIndex]
              if (!promptId) return Promise.resolve()
              return insertPromptResult(promptId, result)
            })
          )

          send({ type: "done", reportId })
        } catch (err) {
          logger.error({ err }, "failed to persist report")
          send({
            type: "error",
            message: "Failed to save report. Please try again.",
          })
        }
      } catch (err) {
        if (req.signal.aborted) return
        logger.error({ err }, "analyze stream error")
        try {
          send({
            type: "error",
            message:
              err instanceof Error ? err.message : "Analysis failed",
          })
        } catch {
          // ignore
        }
      } finally {
        clearInterval(heartbeatInterval)
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: SSE_HEADERS })
}
