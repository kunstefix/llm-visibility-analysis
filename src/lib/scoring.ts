import { normalizeBrand } from "@/lib/normalize"
import type { BrandMention, Citation } from "@/lib/llm/types"

export type PromptResultData = {
  provider: "openai" | "gemini"
  brands: BrandMention[]
  citations: Citation[]
  errorMessage?: string
}

function targetMentions(
  results: PromptResultData[],
  targetNorm: string
): number {
  return results.reduce((sum, r) => {
    const brand = r.brands.find((b) => b.normalizedName === targetNorm)
    return sum + (brand?.mentions ?? 0)
  }, 0)
}

function totalMentions(results: PromptResultData[]): number {
  return results.reduce(
    (sum, r) => sum + r.brands.reduce((s, b) => s + b.mentions, 0),
    0
  )
}

export function visibilityPerLLM(
  results: PromptResultData[],
  targetBrand: string
): number {
  const targetNorm = normalizeBrand(targetBrand)
  const total = totalMentions(results)
  if (total === 0) return 0
  const target = targetMentions(results, targetNorm)
  return Math.min(100, Math.max(0, (target / total) * 100))
}

export function overallVisibility(
  openAiScore: number | null,
  geminiScore: number | null
): number {
  if (openAiScore !== null && geminiScore !== null) {
    return (openAiScore + geminiScore) / 2
  }
  return openAiScore ?? geminiScore ?? 0
}

export function promptVisibility(
  result: PromptResultData,
  targetBrand: string
): number | null {
  const targetNorm = normalizeBrand(targetBrand)
  const total = result.brands.reduce((s, b) => s + b.mentions, 0)
  if (total === 0) return null
  const target =
    result.brands.find((b) => b.normalizedName === targetNorm)?.mentions ?? 0
  return (target / total) * 100
}

export function mentionRate(
  promptResults: PromptResultData[][],
  targetBrand: string
): number {
  const targetNorm = normalizeBrand(targetBrand)
  const total = promptResults.length
  if (total === 0) return 0
  const withMention = promptResults.filter((results) =>
    results.some((r) => r.brands.some((b) => b.normalizedName === targetNorm))
  ).length
  return (withMention / total) * 100
}

export type BrandShare = {
  name: string
  normalizedName: string
  share: number
  mentions: number
}

export function marketShare(results: PromptResultData[]): BrandShare[] {
  const aggregated = new Map<
    string,
    { name: string; normalizedName: string; mentions: number; count: number }
  >()

  for (const r of results) {
    for (const b of r.brands) {
      const existing = aggregated.get(b.normalizedName)
      if (existing) {
        existing.mentions += b.mentions
        existing.count += 1
        // keep most-frequent display name (prefer longer/same)
        if (b.name.length > existing.name.length) existing.name = b.name
      } else {
        aggregated.set(b.normalizedName, {
          name: b.name,
          normalizedName: b.normalizedName,
          mentions: b.mentions,
          count: 1,
        })
      }
    }
  }

  const total = [...aggregated.values()].reduce((s, b) => s + b.mentions, 0)
  if (total === 0) return []

  const sorted = [...aggregated.values()]
    .map(({ name, normalizedName, mentions }) => ({
      name,
      normalizedName,
      mentions,
      share: (mentions / total) * 100,
    }))
    .sort((a, b) => b.mentions - a.mentions)

  if (sorted.length <= 8) return sorted

  const top = sorted.slice(0, 8)
  const otherMentions = sorted.slice(8).reduce((s, b) => s + b.mentions, 0)
  top.push({
    name: "Other",
    normalizedName: "other",
    mentions: otherMentions,
    share: (otherMentions / total) * 100,
  })
  return top
}

export type DomainCitation = {
  domain: string
  count: number
}

export function domainCitations(results: PromptResultData[]): DomainCitation[] {
  // group results by prompt (each PromptResultData is one prompt-provider pair)
  // The caller passes all prompt results for a single LLM across all prompts.
  // Within-prompt dedup: a domain cited multiple times in one prompt counts once.
  // Across-prompt accumulation: count how many prompts cite this domain.
  const domainCount = new Map<string, number>()

  for (const r of results) {
    const seenInThisPrompt = new Set<string>()
    for (const c of r.citations) {
      if (!seenInThisPrompt.has(c.domain)) {
        seenInThisPrompt.add(c.domain)
        domainCount.set(c.domain, (domainCount.get(c.domain) ?? 0) + 1)
      }
    }
  }

  return [...domainCount.entries()]
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
}
