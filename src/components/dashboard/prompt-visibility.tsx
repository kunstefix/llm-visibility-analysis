"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const STAGE_COLORS: Record<string, string> = {
  awareness: "bg-sky-100 text-sky-700 border-sky-200",
  consideration: "bg-violet-100 text-violet-700 border-violet-200",
  decision: "bg-emerald-100 text-emerald-700 border-emerald-200",
  problem: "bg-amber-100 text-amber-700 border-amber-200",
  solution: "bg-rose-100 text-rose-700 border-rose-200",
}

export type PromptVisibilityRow = {
  id: string
  text: string
  stage: string
  order: number
  openAiVisibility: number | null
  geminiVisibility: number | null
}

function ScoreBar({
  value,
  color,
}: {
  value: number | null
  color: "blue" | "green"
}) {
  if (value === null) {
    return (
      <span className="text-xs text-muted-foreground">—</span>
    )
  }

  const pct = Math.round(value)
  const barColor =
    color === "blue"
      ? "bg-[hsl(220,70%,55%)]"
      : "bg-[hsl(160,55%,42%)]"

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs tabular-nums text-foreground">
        {pct}%
      </span>
    </div>
  )
}

export function PromptVisibilityCard({
  rows,
}: {
  rows: PromptVisibilityRow[]
}) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Per-Prompt Visibility</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Prompt
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Stage
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: "hsl(220,70%,55%)" }}
                    />
                    ChatGPT
                  </span>
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: "hsl(160,55%,42%)" }}
                    />
                    Gemini
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id}
                  className="border-b last:border-0 hover:bg-muted/20"
                >
                  <td className="max-w-xs px-4 py-3">
                    <span className="mr-2 font-medium text-muted-foreground">
                      {i + 1}.
                    </span>
                    <span className="text-foreground">{row.text}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize",
                        STAGE_COLORS[row.stage] ?? ""
                      )}
                    >
                      {row.stage}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBar value={row.openAiVisibility} color="blue" />
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBar value={row.geminiVisibility} color="green" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
