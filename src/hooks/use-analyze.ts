"use client"

import { useState, useCallback, useRef } from "react"
import type { LLMResult } from "@/lib/llm/types"
import type { GeneratedPrompt } from "@/lib/prompts/generate"

export type AnalyzeStage =
  | "idle"
  | "scraping"
  | "generating_prompts"
  | "querying_llms"
  | "aggregating"
  | "done"
  | "error"

export type CellResult = {
  promptIndex: number
  result: LLMResult
}

export type AnalyzeState = {
  stage: AnalyzeStage
  prompts: GeneratedPrompt[]
  results: CellResult[]
  reportId: string | null
  error: string | null
  elapsedMs: number
}

export function useAnalyze() {
  const [state, setState] = useState<AnalyzeState>({
    stage: "idle",
    prompts: [],
    results: [],
    reportId: null,
    error: null,
    elapsedMs: 0,
  })

  const controllerRef = useRef<AbortController | null>(null)
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cancel = useCallback(() => {
    controllerRef.current?.abort()
    if (timerRef.current) clearInterval(timerRef.current)
    setState((s) => ({ ...s, stage: "error", error: "Cancelled" }))
  }, [])

  const start = useCallback(async (url: string) => {
    controllerRef.current?.abort()
    if (timerRef.current) clearInterval(timerRef.current)

    const controller = new AbortController()
    controllerRef.current = controller
    startTimeRef.current = Date.now()

    setState({
      stage: "scraping",
      prompts: [],
      results: [],
      reportId: null,
      error: null,
      elapsedMs: 0,
    })

    timerRef.current = setInterval(() => {
      setState((s) => ({ ...s, elapsedMs: Date.now() - startTimeRef.current }))
    }, 500)

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const raw = line.slice(6)
          if (!raw.trim()) continue

          let event: Record<string, unknown>
          try {
            event = JSON.parse(raw)
          } catch {
            continue
          }

          handleEvent(event)
        }
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return
      const message = err instanceof Error ? err.message : "Unknown error"
      setState((s) => ({ ...s, stage: "error", error: message }))
    } finally {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    function handleEvent(event: Record<string, unknown>) {
      switch (event.type) {
        case "stage":
          setState((s) => ({
            ...s,
            stage: event.stage as AnalyzeStage,
          }))
          break
        case "prompts":
          setState((s) => ({
            ...s,
            prompts: event.prompts as GeneratedPrompt[],
          }))
          break
        case "prompt-complete":
          setState((s) => ({
            ...s,
            results: [
              ...s.results,
              {
                promptIndex: event.promptIndex as number,
                result: event.result as LLMResult,
              },
            ],
          }))
          break
        case "done":
          setState((s) => ({
            ...s,
            stage: "done",
            reportId: event.reportId as string,
          }))
          break
        case "error":
          setState((s) => ({
            ...s,
            stage: "error",
            error: (event.message as string) ?? "Unknown error",
          }))
          break
      }
    }
  }, [])

  return { state, start, cancel }
}
