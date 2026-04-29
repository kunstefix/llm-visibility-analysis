import { cn } from "@/lib/utils"
import type { LLMResult } from "@/lib/llm/types"

type Props = {
  result: LLMResult | undefined
  isLoading: boolean
}

export function ResultCell({ result, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex h-24 animate-pulse flex-col gap-2 rounded-md border p-3">
        <div className="h-3 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="h-3 w-5/6 rounded bg-muted" />
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex h-24 items-center justify-center rounded-md border text-xs text-muted-foreground">
        Waiting…
      </div>
    )
  }

  if (result.errorMessage) {
    return (
      <div className="flex h-24 items-center justify-center rounded-md border border-destructive/30 bg-destructive/5 px-3 text-xs text-destructive">
        {result.errorMessage}
      </div>
    )
  }

  const topBrands = result.brands.slice(0, 3)

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-md border p-3 text-xs",
        "transition-all duration-300"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium capitalize">{result.provider}</span>
        <span className="text-muted-foreground">
          {result.citations.length} citation{result.citations.length !== 1 ? "s" : ""}
        </span>
      </div>
      {topBrands.length > 0 ? (
        <ul className="mt-1 space-y-0.5">
          {topBrands.map((b) => (
            <li key={b.normalizedName} className="flex items-center gap-1">
              <span className="truncate text-muted-foreground">{b.name}</span>
              <span className="ml-auto tabular-nums">{b.mentions}×</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-muted-foreground">No brands mentioned</p>
      )}
    </div>
  )
}
