"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

type Props = {
  overallScore: number
  openAiScore: number | null
  geminiScore: number | null
  mentionRateOverall: number
  brandName: string
  openAiFailed: boolean
  geminiFailed: boolean
}

function ScoreRing({
  score,
  label,
  size = "lg",
}: {
  score: number
  label: string
  size?: "lg" | "sm"
}) {
  const r = size === "lg" ? 44 : 28
  const sw = size === "lg" ? 10 : 8
  const dim = (r + sw) * 2
  const cx = dim / 2
  const circum = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(score / 100, 1))
  const dash = clamped * circum

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim}>
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            style={{ stroke: "hsl(var(--muted))" }}
            strokeWidth={sw}
          />
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            style={{
              stroke: "hsl(var(--primary))",
              transition: "stroke-dasharray 0.6s ease",
            }}
            strokeWidth={sw}
            strokeDasharray={`${dash} ${circum - dash}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cx})`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "font-bold tabular-nums",
              size === "lg" ? "text-3xl" : "text-xl"
            )}
          >
            {Math.round(score)}
            <span className={size === "lg" ? "text-base" : "text-sm"}>%</span>
          </span>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function UnavailableRing({
  label,
  reason,
  size = "sm",
}: {
  label: string
  reason?: string
  size?: "lg" | "sm"
}) {
  const dim = size === "lg" ? 108 : 72
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex items-center justify-center rounded-full border-2 border-dashed border-muted text-xs text-muted-foreground"
        style={{ width: dim, height: dim }}
      >
        N/A
      </div>
      <p className="text-center text-xs text-muted-foreground">{label}</p>
      {reason && <p className="text-xs text-destructive">{reason}</p>}
    </div>
  )
}

export function Summary({
  overallScore,
  openAiScore,
  geminiScore,
  mentionRateOverall,
  brandName,
  openAiFailed,
  geminiFailed,
}: Props) {
  const neverMentioned = overallScore === 0 && mentionRateOverall === 0

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-10">
          <ScoreRing score={overallScore} label="Overall visibility" size="lg" />

          <div className="flex gap-8">
            {openAiScore !== null ? (
              <ScoreRing score={openAiScore} label="ChatGPT" size="sm" />
            ) : (
              <UnavailableRing
                label="ChatGPT"
                reason={openAiFailed ? "Unavailable" : undefined}
              />
            )}
            {geminiScore !== null ? (
              <ScoreRing score={geminiScore} label="Gemini" size="sm" />
            ) : (
              <UnavailableRing
                label="Gemini"
                reason={geminiFailed ? "Unavailable" : undefined}
              />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Mention rate
            </p>
            <p className="text-4xl font-bold tabular-nums">
              {Math.round(mentionRateOverall)}
              <span className="text-2xl">%</span>
            </p>
            <p className="text-xs text-muted-foreground">
              of prompts mentioned {brandName}
            </p>
          </div>
        </div>

        {neverMentioned && (
          <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <strong>{brandName}</strong> was not mentioned in any LLM response.
            See the{" "}
            <button
              className="cursor-pointer underline hover:text-primary"
              onClick={() => {
                window.history.pushState(null, "", "?tab=insights")
                window.dispatchEvent(new PopStateEvent("popstate"))
              }}
            >
              Recommendations
            </button>{" "}
            section under the Insights tab for next steps.
       
          </div>
        )}
      </CardContent>
    </Card>
  )
}
