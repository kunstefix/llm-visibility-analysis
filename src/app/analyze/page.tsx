"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { StageStepper } from "@/components/analyze/stage-stepper"
import { PromptCard } from "@/components/analyze/prompt-card"
import { ResultCell } from "@/components/analyze/result-cell"
import { useAnalyze } from "@/hooks/use-analyze"

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const rem = s % 60
  if (m > 0) return `${m}m ${rem}s`
  return `${s}s`
}

export default function AnalyzePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const url = searchParams.get("url") ?? ""

  const { state, start, cancel } = useAnalyze()

  useEffect(() => {
    if (url) start(url)
  }, [url, start])

  useEffect(() => {
    if (state.stage === "done" && state.reportId) {
      const timer = setTimeout(() => {
        router.push(`/report/${state.reportId}`)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [state.stage, state.reportId, router])

  const PROVIDERS = ["openai", "gemini"] as const

  function getResult(promptIndex: number, provider: string) {
    return state.results.find(
      (r) => r.promptIndex === promptIndex && r.result.provider === provider
    )?.result
  }

  function isCellLoading(promptIndex: number, provider: string): boolean {
    if (state.stage === "idle" || state.stage === "scraping" || state.stage === "generating_prompts") {
      return false
    }
    return !getResult(promptIndex, provider)
  }

  return (
    <div className="flex min-h-screen flex-col gap-8 px-4 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground truncate max-w-md">{url}</p>
          {state.elapsedMs > 0 && (
            <p className="text-xs text-muted-foreground">
              {formatElapsed(state.elapsedMs)}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={cancel}
          disabled={state.stage === "done" || state.stage === "error"}
        >
          Cancel
        </Button>
      </div>

      {/* Stage stepper */}
      <StageStepper stage={state.stage} />

      {/* Error state */}
      {state.stage === "error" && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {state.error ?? "Something went wrong."}
        </div>
      )}

      {/* Done state */}
      {state.stage === "done" && (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-4 text-sm font-medium text-primary">
          Report ready — redirecting…
        </div>
      )}

      {/* Prompts panel */}
      {state.prompts.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Prompts
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {state.prompts.map((p) => (
              <PromptCard key={p.order} prompt={p} />
            ))}
          </div>
        </section>
      )}

      {/* Results grid */}
      {state.prompts.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Results
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-separate border-spacing-2">
              <thead>
                <tr>
                  <th className="w-8 text-left text-xs text-muted-foreground font-normal">#</th>
                  {PROVIDERS.map((p) => (
                    <th
                      key={p}
                      className="text-left text-xs font-semibold capitalize text-muted-foreground"
                    >
                      {p === "openai" ? "ChatGPT" : "Gemini"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.prompts.map((prompt, i) => (
                  <tr key={prompt.order}>
                    <td className="text-xs text-muted-foreground align-top pt-1">{i + 1}</td>
                    {PROVIDERS.map((provider) => (
                      <td key={provider} className="align-top">
                        <ResultCell
                          result={getResult(i, provider)}
                          isLoading={isCellLoading(i, provider)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
