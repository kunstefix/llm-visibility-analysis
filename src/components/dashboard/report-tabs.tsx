"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "market-share", label: "Brands" },
  { key: "prompts", label: "Prompts" },
  { key: "insights", label: "Insights" },
] as const

type TabKey = (typeof TABS)[number]["key"]

function isValidTab(value: string | null): value is TabKey {
  return TABS.some((t) => t.key === value)
}

type Props = {
  header: React.ReactNode
  overview: React.ReactNode
  marketShare: React.ReactNode
  prompts: React.ReactNode
  insights: React.ReactNode
  footer: React.ReactNode
}

export function ReportTabs({
  header,
  overview,
  marketShare,
  prompts,
  insights,
  footer,
}: Props) {
  const [active, setActive] = useState<TabKey>("overview")

  // Read initial tab from URL on mount
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab")
    if (isValidTab(tab)) setActive(tab)
  }, [])

  // Sync back/forward browser navigation
  useEffect(() => {
    function onPopState() {
      const tab = new URLSearchParams(window.location.search).get("tab")
      setActive(isValidTab(tab) ? tab : "overview")
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  function handleTabChange(tab: TabKey) {
    setActive(tab)
    const url = new URL(window.location.href)
    if (tab === "overview") {
      url.searchParams.delete("tab")
    } else {
      url.searchParams.set("tab", tab)
    }
    window.history.pushState(null, "", url.toString())
  }

  const panels: Record<TabKey, React.ReactNode> = {
    overview,
    "market-share": marketShare,
    prompts,
    insights,
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {header}

      <div className="mt-6 flex gap-1 rounded-xl border bg-muted/40 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={cn(
              "flex-1 cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-all",
              active === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex w-full flex-col gap-6">{panels[active]}</div>

      {footer && <div className="mt-6">{footer}</div>}
    </div>
  )
}
