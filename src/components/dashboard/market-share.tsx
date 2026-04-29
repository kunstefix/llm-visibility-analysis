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
  const targetNorm = targetBrand.toLowerCase()

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
        className="w-fit cursor-pointer text-left text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? "Hide" : "Show"} full table
      </button>

      {expanded && (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  Brand
                </th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                  Share
                </th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                  Mentions
                </th>
              </tr>
            </thead>
            <tbody>
              {[...shares]
                .sort((a, b) => b.share - a.share)
                .map((b) => (
                  <tr
                    key={b.normalizedName}
                    className={[
                      "border-b last:border-0",
                      b.normalizedName === targetNorm
                        ? "bg-primary/5 font-medium"
                        : "hover:bg-muted/30",
                    ].join(" ")}
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
      )}
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
