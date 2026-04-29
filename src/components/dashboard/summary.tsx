"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("h-3.5 w-3.5", className)}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function MetricLabel({
  children,
  tooltip,
}: {
  children: React.ReactNode
  tooltip: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <p className="inline-flex cursor-default items-center gap-1 text-center text-xs text-muted-foreground">
          {children}
          <InfoIcon className="text-muted-foreground/60" />
        </p>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  )
}

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
  tooltip,
}: {
  score: number
  label: string
  size?: "lg" | "sm"
  tooltip?: string
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
      {tooltip ? (
        <MetricLabel tooltip={tooltip}>{label}</MetricLabel>
      ) : (
        <p className="text-center text-xs text-muted-foreground">{label}</p>
      )}
    </div>
  )
}

function UnavailableRing({
  label,
  reason,
  size = "sm",
  tooltip,
}: {
  label: string
  reason?: string
  size?: "lg" | "sm"
  tooltip?: string
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
      {tooltip ? (
        <MetricLabel tooltip={tooltip}>{label}</MetricLabel>
      ) : (
        <p className="text-center text-xs text-muted-foreground">{label}</p>
      )}
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
    <TooltipProvider delayDuration={300}>
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-10">
          <ScoreRing
            score={overallScore}
            label="Overall visibility"
            size="lg"
            tooltip="Weighted average of ChatGPT and Gemini visibility scores. Measures how prominently your brand appears in AI-generated answers."
          />

          <div className="flex gap-8">
            {openAiScore !== null ? (
              <ScoreRing
                score={openAiScore}
                label="ChatGPT"
                size="sm"
                tooltip="Visibility score on ChatGPT (OpenAI). Calculated from how often and prominently your brand appears across all tested prompts."
              />
            ) : (
              <UnavailableRing
                label="ChatGPT"
                reason={openAiFailed ? "Unavailable" : undefined}
                tooltip="ChatGPT visibility score could not be calculated."
              />
            )}
            {geminiScore !== null ? (
              <ScoreRing
                score={geminiScore}
                label="Gemini"
                size="sm"
                tooltip="Visibility score on Google Gemini. Calculated from how often and prominently your brand appears across all tested prompts."
              />
            ) : (
              <UnavailableRing
                label="Gemini"
                reason={geminiFailed ? "Unavailable" : undefined}
                tooltip="Gemini visibility score could not be calculated."
              />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="inline-flex cursor-default items-center gap-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Mention rate
                  <InfoIcon className="text-muted-foreground/60" />
                </p>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Percentage of tested prompts where your brand was mentioned at least once by either ChatGPT or Gemini.
              </TooltipContent>
            </Tooltip>
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
    </TooltipProvider>
  )
}
