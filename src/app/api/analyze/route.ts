import { type NextRequest } from "next/server"
import { UrlInputSchema } from "@/lib/validation"
import { scrapeUrl } from "@/lib/scrape"
import { generatePrompts } from "@/lib/prompts/generate"

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

  try {
    const context = await scrapeUrl(url, req.signal)
    const prompts = await generatePrompts(context, req.signal)
    return Response.json({ scrapedContext: context, prompts })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed"
    return Response.json({ error: message }, { status: 500 })
  }
}
