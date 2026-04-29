"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  awareness: "bg-blue-100 text-blue-700 border-blue-200",
  consideration: "bg-purple-100 text-purple-700 border-purple-200",
  decision: "bg-green-100 text-green-700 border-green-200",
  problem: "bg-orange-100 text-orange-700 border-orange-200",
  solution: "bg-teal-100 text-teal-700 border-teal-200",
}

function highlightBrand(text: string, brandName: string): string {
  if (!brandName || !text) return text
  const escaped = brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return text.replace(new RegExp(`(${escaped})`, "gi"), "**$1**")
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
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-sm italic text-muted-foreground">Unavailable</p>
      </div>
    )
  }

  if (result.errorMessage) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-sm text-destructive">{result.errorMessage}</p>
      </div>
    )
  }

  const text = highlightBrand(result.answerText ?? "", targetBrand)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="max-h-56 overflow-y-auto rounded-md bg-muted/30 p-3 text-sm leading-relaxed">
        <p className="whitespace-pre-wrap">
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
      </div>
      {result.citations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {result.citations.slice(0, 6).map((c) => (
            <a
              key={c.url}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="max-w-[180px] cursor-pointer truncate rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Per-Prompt Results</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple">
          {prompts.map((prompt, i) => (
            <AccordionItem key={prompt.id} value={prompt.id}>
              <AccordionTrigger className="cursor-pointer text-left hover:no-underline">
                <div className="flex min-w-0 items-center gap-3 pr-2">
                  <span className="w-4 shrink-0 text-sm text-muted-foreground">{i + 1}.</span>
                  <Badge
                    variant="outline"
                    className={
                      STAGE_COLORS[prompt.stage] ??
                      "bg-gray-100 text-gray-700 border-gray-200"
                    }
                  >
                    {prompt.stage}
                  </Badge>
                  <span className="truncate text-sm">{prompt.text}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-6 pt-2 sm:grid-cols-2">
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
      </CardContent>
    </Card>
  )
}
