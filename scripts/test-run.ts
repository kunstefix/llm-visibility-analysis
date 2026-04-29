import "dotenv/config"
import { scrapeUrl } from "../src/lib/scrape"
import { generatePrompts } from "../src/lib/prompts/generate"
import { queryOpenAI } from "../src/lib/llm/openai"
import { queryGemini } from "../src/lib/llm/gemini"

const url = process.argv[2]
if (!url) {
  console.error("Usage: pnpm tsx scripts/test-run.ts <url>")
  process.exit(1)
}

const controller = new AbortController()
process.on("SIGINT", () => controller.abort())

async function main() {
  console.log(`\nScraping ${url}...`)
  const context = await scrapeUrl(url, controller.signal)
  console.log("Context:", JSON.stringify(context, null, 2))

  console.log("\nGenerating prompts...")
  const prompts = await generatePrompts(context, controller.signal)
  console.log("Prompts:")
  prompts.forEach((p, i) => console.log(`  ${i + 1}. [${p.stage}] ${p.text}`))

  const firstPrompt = prompts[0]
  if (!firstPrompt) return

  console.log(`\nQuerying LLMs with: "${firstPrompt.text}"`)
  const [openAiResult, geminiResult] = await Promise.allSettled([
    queryOpenAI(firstPrompt.text, controller.signal),
    queryGemini(firstPrompt.text, controller.signal),
  ])

  if (openAiResult.status === "fulfilled") {
    const r = openAiResult.value
    console.log(`\nOpenAI — ${r.durationMs}ms`)
    console.log(`  Answer: ${r.answerText.slice(0, 200)}...`)
    console.log(`  Brands: ${r.brands.map((b) => b.name).join(", ")}`)
    console.log(`  Citations: ${r.citations.length}`)
  } else {
    console.error("OpenAI failed:", openAiResult.reason)
  }

  if (geminiResult.status === "fulfilled") {
    const r = geminiResult.value
    console.log(`\nGemini — ${r.durationMs}ms`)
    console.log(`  Answer: ${r.answerText.slice(0, 200)}...`)
    console.log(`  Brands: ${r.brands.map((b) => b.name).join(", ")}`)
    console.log(`  Citations: ${r.citations.length}`)
  } else {
    console.error("Gemini failed:", geminiResult.reason)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
