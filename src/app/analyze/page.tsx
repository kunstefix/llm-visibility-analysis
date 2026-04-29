"use client"

import { Suspense, useEffect } from "react"
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

function AnalyzeContent() {
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
  const isActive =
    state.stage !== "idle" && state.stage !== "error" && state.stage !== "done"
  const showGrid =
    state.prompts.length > 0 &&
    state.stage !== "idle" &&
    state.stage !== "scraping" &&
    state.stage !== "generating_prompts"

  function getResult(promptIndex: number, provider: string) {
    return state.results.find(
      (r) => r.promptIndex === promptIndex && r.result.provider === provider
    )?.result
  }

  function isCellLoading(promptIndex: number, provider: string): boolean {
    if (!showGrid) return false
    return !getResult(promptIndex, provider)
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate font-medium">{url}</p>
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            {isActive && (
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Running
              </span>
            )}
            {state.elapsedMs > 0 && (
              <span className="tabular-nums">{formatElapsed(state.elapsedMs)}</span>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={cancel}
          disabled={state.stage === "done" || state.stage === "error"}
          className="shrink-0 cursor-pointer"
        >
          Cancel
        </Button>
      </div>

      {/* Stage stepper */}
      <StageStepper stage={state.stage} />

      {/* Status banners */}
      {state.stage === "error" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {state.error ?? "Something went wrong."}
        </div>
      )}
      {state.stage === "done" && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
          Report ready — redirecting…
        </div>
      )}

      {/* Prompts */}
      {state.prompts.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Prompts
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {state.prompts.map((p) => (
              <PromptCard key={p.order} prompt={p} />
            ))}
          </div>
        </section>
      )}

      {/* Results grid — only shown once LLM querying starts */}
      {showGrid && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Results
          </h2>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full table-fixed border-separate border-spacing-3 p-1">
              <thead>
                <tr>
                  <th className="w-7" />
                  {PROVIDERS.map((p) => (
                    <th
                      key={p}
                      className="pb-1 text-left text-xs font-semibold text-muted-foreground"
                    >
                      {p === "openai" ? "ChatGPT" : "Gemini"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.prompts.map((prompt, i) => (
                  <tr key={prompt.order}>
                    <td className="align-middle text-center text-xs text-muted-foreground">
                      {i + 1}
                    </td>
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

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <AnalyzeContent />
    </Suspense>
  )
}
