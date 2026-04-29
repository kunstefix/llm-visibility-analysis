"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

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
  const data = [
    {
      metric: "Visibility %",
      ChatGPT: openAiScore ?? 0,
      Gemini: geminiScore ?? 0,
    },
    {
      metric: "Total mentions",
      ChatGPT: openAiMentions,
      Gemini: geminiMentions,
    },
    {
      metric: "Unique brands",
      ChatGPT: openAiUniqueBrands,
      Gemini: geminiUniqueBrands,
    },
    {
      metric: "Citations",
      ChatGPT: openAiCitations,
      Gemini: geminiCitations,
    },
  ]

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">ChatGPT vs Gemini</h2>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
          <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="ChatGPT" fill="hsl(220 70% 50%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Gemini" fill="hsl(160 60% 45%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  )
}
