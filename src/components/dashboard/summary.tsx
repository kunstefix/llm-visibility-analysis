import { cn } from "@/lib/utils"

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
  const rounded = Math.round(score)
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "flex items-center justify-center rounded-full border-4 border-primary font-bold tabular-nums",
          size === "lg" ? "h-32 w-32 text-4xl" : "h-20 w-20 text-2xl"
        )}
      >
        {rounded}
        <span className={size === "lg" ? "text-xl" : "text-sm"}>%</span>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
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
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-8">
        <ScoreRing score={overallScore} label="Overall visibility" size="lg" />
        <div className="flex gap-6">
          {openAiScore !== null ? (
            <ScoreRing score={openAiScore} label="ChatGPT" size="sm" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-muted text-xs text-muted-foreground text-center">
                N/A
              </div>
              <p className="text-xs text-muted-foreground">ChatGPT</p>
              {openAiFailed && (
                <p className="text-xs text-destructive">Unavailable</p>
              )}
            </div>
          )}
          {geminiScore !== null ? (
            <ScoreRing score={geminiScore} label="Gemini" size="sm" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-muted text-xs text-muted-foreground text-center">
                N/A
              </div>
              <p className="text-xs text-muted-foreground">Gemini</p>
              {geminiFailed && (
                <p className="text-xs text-destructive">Unavailable</p>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Mention rate</p>
          <p className="text-3xl font-bold tabular-nums">
            {Math.round(mentionRateOverall)}%
          </p>
          <p className="text-xs text-muted-foreground">
            of prompts mentioned {brandName}
          </p>
        </div>
      </div>

      {neverMentioned && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <strong>{brandName}</strong> was not mentioned in any LLM response.
          See the Recommendations section below for next steps.
        </div>
      )}
    </section>
  )
}
