import { cn } from "@/lib/utils"
import type { AnalyzeStage } from "@/hooks/use-analyze"

const STAGES: { key: AnalyzeStage; label: string }[] = [
  { key: "scraping", label: "Scraping" },
  { key: "generating_prompts", label: "Generating prompts" },
  { key: "querying_llms", label: "Querying LLMs" },
  { key: "aggregating", label: "Aggregating" },
]

const STAGE_ORDER: AnalyzeStage[] = [
  "scraping",
  "generating_prompts",
  "querying_llms",
  "aggregating",
  "done",
]

function stageIndex(stage: AnalyzeStage): number {
  return STAGE_ORDER.indexOf(stage)
}

type Props = { stage: AnalyzeStage }

export function StageStepper({ stage }: Props) {
  const current = stageIndex(stage)

  return (
    <ol className="flex items-center gap-2 text-sm">
      {STAGES.map((s, i) => {
        const done = current > i
        const active = current === i
        return (
          <li key={s.key} className="flex items-center gap-2">
            {i > 0 && <span className="text-muted-foreground">→</span>}
            <span
              className={cn(
                "rounded-full px-3 py-1 font-medium",
                done && "bg-primary text-primary-foreground",
                active && "bg-accent text-accent-foreground animate-pulse",
                !done && !active && "text-muted-foreground"
              )}
            >
              {s.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
