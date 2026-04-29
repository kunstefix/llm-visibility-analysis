"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  openAiScore: number | null
  geminiScore: number | null
  openAiMentions: number
  geminiMentions: number
  openAiUniqueBrands: number
  geminiUniqueBrands: number
  openAiCitations: number
  geminiCitations: number
}

const CHATGPT_COLOR = "hsl(220, 70%, 55%)"
const GEMINI_COLOR = "hsl(160, 55%, 42%)"

export function ComparisonChart({
  openAiScore,
  geminiScore,
  openAiMentions,
  geminiMentions,
  openAiUniqueBrands,
  geminiUniqueBrands,
  openAiCitations,
  geminiCitations,
}: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const data = [
    {
      metric: "Visibility",
      ChatGPT: Math.round(openAiScore ?? 0),
      Gemini: Math.round(geminiScore ?? 0),
    },
    {
      metric: "Mentions",
      ChatGPT: openAiMentions,
      Gemini: geminiMentions,
    },
    {
      metric: "Brands",
      ChatGPT: openAiUniqueBrands,
      Gemini: geminiUniqueBrands,
    },
    {
      metric: "Citations",
      ChatGPT: openAiCitations,
      Gemini: geminiCitations,
    },
  ]

  if (!mounted) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">ChatGPT vs Gemini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] animate-pulse rounded-md bg-muted/30" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">ChatGPT vs Gemini</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%" }}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={data}
            margin={{ top: 4, right: 12, left: -20, bottom: 4 }}
            barCategoryGap="30%"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="metric"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontSize: 12,
              }}
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
            <Bar dataKey="ChatGPT" fill={CHATGPT_COLOR} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Gemini" fill={GEMINI_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
