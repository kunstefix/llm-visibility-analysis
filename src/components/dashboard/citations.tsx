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
    <div className="flex items-center gap-3 py-2 border-b last:border-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
        alt=""
        width={20}
        height={20}
        className="rounded-sm"
      />
      <span className="flex-1 text-sm truncate">{domain}</span>
      <div className="flex items-center gap-1">
        {providers.includes("openai") && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
            ChatGPT
          </span>
        )}
        {providers.includes("gemini") && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
            Gemini
          </span>
        )}
      </div>
      <span className="text-xs text-muted-foreground tabular-nums w-6 text-right">
        {count}×
      </span>
    </div>
  )
}

export function Citations({ openAiCitations, geminiCitations }: Props) {
  // Merge both lists, combining counts and tracking providers
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
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Citation Sources</h2>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No citations found.</p>
      ) : (
        <div className="max-h-80 overflow-y-auto rounded-md border px-4">
          {sorted.map((entry) => (
            <DomainRow key={entry.domain} {...entry} />
          ))}
        </div>
      )}
    </section>
  )
}
