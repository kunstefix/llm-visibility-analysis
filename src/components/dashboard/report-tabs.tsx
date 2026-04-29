"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "market-share", label: "Brands" },
  { key: "prompts", label: "Prompts" },
  { key: "insights", label: "Insights" },
] as const

type TabKey = (typeof TABS)[number]["key"]

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

  const panels: Record<TabKey, React.ReactNode> = {
    overview,
    "market-share": marketShare,
    prompts,
    insights,
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-col gap-6 px-4 py-8">
      {header}

      <div className="mt-6 flex gap-1 rounded-xl border bg-muted/40 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
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
