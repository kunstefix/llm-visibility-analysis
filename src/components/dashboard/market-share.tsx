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
import type { BrandShare } from "@/lib/scoring"

const COLORS = [
  "hsl(220 70% 50%)",
  "hsl(160 60% 45%)",
  "hsl(30 80% 55%)",
  "hsl(280 65% 60%)",
  "hsl(340 75% 55%)",
  "hsl(60 70% 50%)",
  "hsl(190 60% 50%)",
  "hsl(0 65% 55%)",
  "hsl(240 40% 60%)",
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

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-medium">{label}</h3>
      {shares.length === 0 ? (
        <p className="text-sm text-muted-foreground">No brand data available</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={shares}
                dataKey="share"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value }) =>
                  `${String(name)}: ${Math.round(Number(value ?? 0))}%`
                }
                labelLine={false}
              >
                {shares.map((entry, i) => (
                  <Cell
                    key={entry.normalizedName}
                    fill={
                      entry.normalizedName === targetNorm
                        ? "hsl(220 70% 50%)"
                        : COLORS[i % COLORS.length]!
                    }
                    stroke={
                      entry.normalizedName === targetNorm
                        ? "hsl(220 70% 35%)"
                        : "transparent"
                    }
                    strokeWidth={
                      entry.normalizedName === targetNorm ? 2 : 0
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `${Math.round(Number(value ?? 0))}%`}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <button
            className="text-xs text-muted-foreground underline text-left"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "Hide" : "Show"} full table
          </button>
          {expanded && (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="py-1 text-left font-medium">Brand</th>
                  <th className="py-1 text-right font-medium">Share</th>
                  <th className="py-1 text-right font-medium">Mentions</th>
                </tr>
              </thead>
              <tbody>
                {[...shares]
                  .sort((a, b) => b.share - a.share)
                  .map((b) => (
                    <tr
                      key={b.normalizedName}
                      className={
                        b.normalizedName === targetNorm
                          ? "bg-primary/5 font-medium"
                          : ""
                      }
                    >
                      <td className="py-1">{b.name}</td>
                      <td className="py-1 text-right tabular-nums">
                        {Math.round(b.share)}%
                      </td>
                      <td className="py-1 text-right tabular-nums">
                        {b.mentions}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  )
}

export function MarketShare({ openAiShares, geminiShares, targetBrand }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Market Share</h2>
      <div className="grid gap-8 sm:grid-cols-2">
        <SinglePie shares={openAiShares} targetBrand={targetBrand} label="ChatGPT" />
        <SinglePie shares={geminiShares} targetBrand={targetBrand} label="Gemini" />
      </div>
    </section>
  )
}
