import { cn } from "@/lib/utils"
import type { AnalyzeStage } from "@/hooks/use-analyze"

const STAGES: { key: AnalyzeStage; label: string }[] = [
  { key: "scraping", label: "Scraping" },
  { key: "generating_prompts", label: "Prompts" },
  { key: "querying_llms", label: "Querying" },
  { key: "aggregating", label: "Saving" },
]

const STAGE_ORDER: AnalyzeStage[] = [
  "idle",
  "scraping",
  "generating_prompts",
  "querying_llms",
  "aggregating",
  "done",
]

type Props = { stage: AnalyzeStage }

export function StageStepper({ stage }: Props) {
  const current = STAGE_ORDER.indexOf(stage)
  const isDone = stage === "done"

  return (
    <div className="flex items-center rounded-xl border bg-card px-4 py-3">
      {STAGES.map((s, i) => {
        const stepNum = i + 1
        const done = isDone || current > stepNum
        const active = current === stepNum

        return (
          <div key={s.key} className="flex flex-1 items-center">
            <div className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
                  done && "bg-primary text-primary-foreground",
                  active && "bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse",
                  !done && !active && "border-2 border-muted text-muted-foreground"
                )}
              >
                {done ? "✓" : stepNum}
              </div>
              <span
                className={cn(
                  "hidden text-xs sm:block",
                  active && "font-medium",
                  !active && !done && "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-px flex-1 transition-colors duration-500",
                  done || isDone ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
