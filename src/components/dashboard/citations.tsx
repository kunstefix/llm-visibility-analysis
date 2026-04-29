import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DomainCitation } from "@/lib/scoring"

type Props = {
  openAiCitations: DomainCitation[]
  geminiCitations: DomainCitation[]
}

function DomainRow({
  domain,
  count,
  providers,
}: {
  domain: string
  count: number
  providers: ("openai" | "gemini")[]
}) {
  return (
    <div className="flex items-center gap-3 border-b py-2.5 last:border-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
        alt=""
        width={18}
        height={18}
        className="shrink-0 rounded-sm opacity-80"
      />
      <span className="flex-1 truncate text-sm">{domain}</span>
      <div className="flex shrink-0 items-center gap-1">
        {providers.includes("openai") && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            ChatGPT
          </span>
        )}
        {providers.includes("gemini") && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Gemini
          </span>
        )}
      </div>
      <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {count}×
      </span>
    </div>
  )
}

export function Citations({ openAiCitations, geminiCitations }: Props) {
  const merged = new Map<
    string,
    { count: number; providers: Set<"openai" | "gemini"> }
  >()

  for (const c of openAiCitations) {
    const existing = merged.get(c.domain) ?? {
      count: 0,
      providers: new Set<"openai" | "gemini">(),
    }
    existing.count += c.count
    existing.providers.add("openai")
    merged.set(c.domain, existing)
  }

  for (const c of geminiCitations) {
    const existing = merged.get(c.domain) ?? {
      count: 0,
      providers: new Set<"openai" | "gemini">(),
    }
    existing.count += c.count
    existing.providers.add("gemini")
    merged.set(c.domain, existing)
  }

  const sorted = [...merged.entries()]
    .map(([domain, { count, providers }]) => ({
      domain,
      count,
      providers: [...providers] as ("openai" | "gemini")[],
    }))
    .sort((a, b) => b.count - a.count)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Citation Sources</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No citations found.</p>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            {sorted.map((entry) => (
              <DomainRow key={entry.domain} {...entry} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
