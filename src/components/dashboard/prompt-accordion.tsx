"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import type { BrandMention, Citation } from "@/lib/llm/types"

type PromptData = {
  id: string
  text: string
  stage: string
  order: number
  openAiResult: ResultData | null
  geminiResult: ResultData | null
}

type ResultData = {
  answerText: string | null
  brands: BrandMention[]
  citations: Citation[]
  errorMessage: string | null
}

type Props = {
  prompts: PromptData[]
  targetBrand: string
}

const STAGE_COLORS: Record<string, string> = {
  awareness: "bg-blue-100 text-blue-800",
  consideration: "bg-purple-100 text-purple-800",
  decision: "bg-green-100 text-green-800",
  problem: "bg-orange-100 text-orange-800",
  solution: "bg-teal-100 text-teal-800",
}

function highlightBrand(text: string, brandName: string): string {
  if (!brandName || !text) return text
  // Simple case-insensitive highlight via wrapping in **
  const escaped = brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return text.replace(
    new RegExp(`(${escaped})`, "gi"),
    "**$1**"
  )
}

function AnswerPane({
  label,
  result,
  targetBrand,
}: {
  label: string
  result: ResultData | null
  targetBrand: string
}) {
  if (!result) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="text-sm text-muted-foreground italic">Unavailable</p>
      </div>
    )
  }

  if (result.errorMessage) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="text-sm text-destructive">{result.errorMessage}</p>
      </div>
    )
  }

  const text = highlightBrand(result.answerText ?? "", targetBrand)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {text.split("**").map((part, i) =>
          i % 2 === 1 ? (
            <strong key={i} className="text-primary">
              {part}
            </strong>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </p>
      {result.citations.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {result.citations.slice(0, 5).map((c) => (
            <a
              key={c.url}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground underline truncate max-w-[200px]"
            >
              {c.domain}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export function PromptAccordion({ prompts, targetBrand }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Per-Prompt Results</h2>
      <Accordion type="multiple">
        {prompts.map((prompt, i) => (
          <AccordionItem key={prompt.id} value={prompt.id}>
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-sm w-4">{i + 1}.</span>
                <Badge
                  variant="outline"
                  className={
                    STAGE_COLORS[prompt.stage] ?? "bg-gray-100 text-gray-800"
                  }
                >
                  {prompt.stage}
                </Badge>
                <span className="text-sm truncate max-w-xs">{prompt.text}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-6 sm:grid-cols-2 pt-2">
                <AnswerPane
                  label="ChatGPT"
                  result={prompt.openAiResult}
                  targetBrand={targetBrand}
                />
                <AnswerPane
                  label="Gemini"
                  result={prompt.geminiResult}
                  targetBrand={targetBrand}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
