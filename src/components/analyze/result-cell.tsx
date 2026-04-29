import { cn } from "@/lib/utils"
import type { LLMResult } from "@/lib/llm/types"

type Props = {
  result: LLMResult | undefined
  isLoading: boolean
}

export function ResultCell({ result, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex min-h-[88px] animate-pulse flex-col gap-2 rounded-lg border bg-muted/30 p-3">
        <div className="h-2.5 w-3/4 rounded bg-muted" />
        <div className="h-2.5 w-1/2 rounded bg-muted" />
        <div className="h-2.5 w-5/6 rounded bg-muted" />
        <div className="h-2.5 w-2/3 rounded bg-muted" />
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex min-h-[88px] items-center justify-center rounded-lg border text-xs text-muted-foreground/50">
        Waiting…
      </div>
    )
  }

  if (result.errorMessage) {
    return (
      <div className="flex min-h-[88px] items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 px-3 text-center text-xs text-destructive">
        {result.errorMessage}
      </div>
    )
  }

  const topBrands = result.brands.slice(0, 4)

  return (
    <div
      className={cn(
        "flex min-h-[88px] flex-col gap-1.5 rounded-lg border bg-card p-3 text-xs",
        "transition-all duration-300"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-foreground">
          {result.provider === "openai" ? "ChatGPT" : "Gemini"}
        </span>
        <span className="shrink-0 text-muted-foreground">
          {result.citations.length} cite{result.citations.length !== 1 ? "s" : ""}
        </span>
      </div>
      {topBrands.length > 0 ? (
        <ul className="mt-0.5 space-y-0.5">
          {topBrands.map((b) => (
            <li key={b.normalizedName} className="flex items-center gap-1">
              <span className="truncate text-muted-foreground">{b.name}</span>
              <span className="ml-auto tabular-nums">{b.mentions}×</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-0.5 italic text-muted-foreground/70">No brands</p>
      )}
    </div>
  )
}
