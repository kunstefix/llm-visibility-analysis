"use client"

import { useState } from "react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { BrandShare } from "@/lib/scoring"

const PALETTE = [
  "hsl(220, 70%, 55%)",
  "hsl(160, 55%, 42%)",
  "hsl(30, 80%, 55%)",
  "hsl(280, 65%, 60%)",
  "hsl(340, 75%, 55%)",
  "hsl(60, 65%, 48%)",
  "hsl(190, 60%, 48%)",
  "hsl(0, 65%, 55%)",
  "hsl(240, 40%, 60%)",
]

type SortKey = "name" | "share" | "mentions"
type SortDir = "asc" | "desc"

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={cn("ml-1 inline-block text-[10px]", active ? "opacity-100" : "opacity-30")}>
      {active && dir === "asc" ? "↑" : "↓"}
    </span>
  )
}

type Props = {
  openAiShares: BrandShare[]
  geminiShares: BrandShare[]
  targetBrand: string
}

function SinglePie({
  shares,
  targetBrand,
  label,
}: {
  shares: BrandShare[]
  targetBrand: string
  label: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("share")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const targetNorm = targetBrand.toLowerCase()

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir(key === "name" ? "asc" : "desc")
    }
  }

  const sorted = [...shares].sort((a, b) => {
    let cmp = 0
    if (sortKey === "name") cmp = a.name.localeCompare(b.name)
    else if (sortKey === "share") cmp = a.share - b.share
    else cmp = a.mentions - b.mentions
    return sortDir === "asc" ? cmp : -cmp
  })

  if (shares.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">{label}</h3>
        <p className="text-sm text-muted-foreground">No brand data available</p>
      </div>
    )
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <h3 className="text-sm font-semibold">{label}</h3>
      <div style={{ width: "100%" }}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={shares}
              dataKey="share"
              nameKey="name"
              cx="50%"
              cy="44%"
              outerRadius={100}
              innerRadius={50}
            >
              {shares.map((entry, i) => (
                <Cell
                  key={entry.normalizedName}
                  fill={
                    entry.normalizedName === targetNorm
                      ? "hsl(220, 70%, 55%)"
                      : PALETTE[i % PALETTE.length]!
                  }
                  stroke={
                    entry.normalizedName === targetNorm
                      ? "hsl(220, 70%, 35%)"
                      : "transparent"
                  }
                  strokeWidth={entry.normalizedName === targetNorm ? 2 : 0}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${Math.round(Number(value ?? 0))}%`, "Share"]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value) => (
                <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <button
        className={cn(
          "lg:hidden inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
          expanded
            ? "border-border bg-muted text-foreground hover:bg-muted/70"
            : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
        )}
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3"><path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
            Hide full table
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3"><path fillRule="evenodd" d="M11.78 9.78a.75.75 0 0 1-1.06 0L8 7.06 5.28 9.78a.75.75 0 0 1-1.06-1.06l3.25-3.25a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06Z" clipRule="evenodd" /></svg>
            Show full table
          </>
        )}
      </button>

      <div className={cn("overflow-hidden rounded-lg border", expanded ? "block" : "hidden", "lg:block")}>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/40">
                {(
                  [
                    { key: "name", label: "Brand", align: "left" },
                    { key: "share", label: "Share", align: "right" },
                    { key: "mentions", label: "Mentions", align: "right" },
                  ] as { key: SortKey; label: string; align: "left" | "right" }[]
                ).map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "cursor-pointer select-none px-3 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground",
                      col.align === "right" ? "text-right" : "text-left"
                    )}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    <SortIcon active={sortKey === col.key} dir={sortDir} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((b) => (
                <tr
                  key={b.normalizedName}
                  className={cn(
                    "border-b last:border-0",
                    b.normalizedName === targetNorm
                      ? "bg-primary/5 font-medium"
                      : "hover:bg-muted/30"
                  )}
                >
                  <td className="px-3 py-2">{b.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {Math.round(b.share)}%
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {b.mentions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  )
}

export function MarketShare({ openAiShares, geminiShares, targetBrand }: Props) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Market Share</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-10 lg:grid-cols-2">
          <SinglePie
            shares={openAiShares}
            targetBrand={targetBrand}
            label="ChatGPT"
          />
          <SinglePie
            shares={geminiShares}
            targetBrand={targetBrand}
            label="Gemini"
          />
        </div>
      </CardContent>
    </Card>
  )
}
