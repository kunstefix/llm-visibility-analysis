import { eq, and, gte } from "drizzle-orm"
import { db } from "./client"
import { reports, prompts, promptResults } from "./schema"
import type { GeneratedPrompt } from "@/lib/prompts/generate"
import type { LLMResult } from "@/lib/llm/types"

export type ReportInsert = {
  url: string
  domain: string
  brandName: string
  scrapedContext: unknown
  status: "completed" | "failed"
  ipHash: string
}

export async function insertReport(data: ReportInsert): Promise<string> {
  const [row] = await db.insert(reports).values(data).returning({ id: reports.id })
  if (!row) throw new Error("Failed to insert report")
  return row.id
}

export async function insertPrompts(
  reportId: string,
  generatedPrompts: GeneratedPrompt[]
): Promise<string[]> {
  const rows = await db
    .insert(prompts)
    .values(
      generatedPrompts.map((p) => ({
        reportId,
        text: p.text,
        stage: p.stage,
        order: p.order,
      }))
    )
    .returning({ id: prompts.id })
  return rows.map((r) => r.id)
}

export async function insertPromptResult(
  promptId: string,
  result: LLMResult
): Promise<void> {
  await db.insert(promptResults).values({
    promptId,
    provider: result.provider,
    rawResponse: result.rawResponse as Record<string, unknown>,
    answerText: result.answerText || null,
    brands: result.brands as unknown as Record<string, unknown>[],
    citations: result.citations as unknown as Record<string, unknown>[],
    durationMs: result.durationMs,
    errorMessage: result.errorMessage ?? null,
  })
}

export type FullReport = {
  report: typeof reports.$inferSelect
  prompts: (typeof prompts.$inferSelect & {
    results: (typeof promptResults.$inferSelect)[]
  })[]
}

export async function getReport(id: string): Promise<FullReport | null> {
  const report = await db.query.reports.findFirst({
    where: eq(reports.id, id),
    with: {
      prompts: {
        orderBy: (p, { asc }) => [asc(p.order)],
        with: {
          results: true,
        },
      },
    },
  })

  if (!report) return null

  return {
    report,
    prompts: (report as FullReport["report"] & {
      prompts: FullReport["prompts"]
    }).prompts,
  }
}

export async function countRecentByIp(
  ipHash: string,
  windowMs: number
): Promise<number> {
  const since = new Date(Date.now() - windowMs)
  const rows = await db
    .select({ id: reports.id })
    .from(reports)
    .where(and(eq(reports.ipHash, ipHash), gte(reports.createdAt, since)))
  return rows.length
}
