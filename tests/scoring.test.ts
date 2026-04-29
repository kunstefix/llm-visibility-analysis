import { describe, it, expect } from "vitest"
import {
  visibilityPerLLM,
  overallVisibility,
  promptVisibility,
  mentionRate,
  marketShare,
  domainCitations,
  type PromptResultData,
} from "@/lib/scoring"

function makeResult(
  provider: "openai" | "gemini",
  brands: { name: string; normalizedName: string; mentions: number }[],
  citations: { url: string; domain: string; title: string }[] = []
): PromptResultData {
  return { provider, brands, citations }
}

describe("visibilityPerLLM", () => {
  it("returns 0 when no mentions", () => {
    const results = [makeResult("openai", [])]
    expect(visibilityPerLLM(results, "hubspot")).toBe(0)
  })

  it("returns 100 when target is only brand", () => {
    const results = [
      makeResult("openai", [
        { name: "HubSpot", normalizedName: "hubspot", mentions: 5 },
      ]),
    ]
    expect(visibilityPerLLM(results, "hubspot")).toBeCloseTo(100)
  })

  it("returns 0 when target is absent", () => {
    const results = [
      makeResult("openai", [
        { name: "Salesforce", normalizedName: "salesforce", mentions: 3 },
      ]),
    ]
    expect(visibilityPerLLM(results, "hubspot")).toBe(0)
  })

  it("calculates share-of-voice across prompts", () => {
    const results = [
      makeResult("openai", [
        { name: "HubSpot", normalizedName: "hubspot", mentions: 2 },
        { name: "Salesforce", normalizedName: "salesforce", mentions: 2 },
      ]),
      makeResult("openai", [
        { name: "HubSpot", normalizedName: "hubspot", mentions: 1 },
        { name: "Zoho", normalizedName: "zoho", mentions: 1 },
      ]),
    ]
    // target: 3 mentions, total: 6 mentions → 50%
    expect(visibilityPerLLM(results, "hubspot")).toBeCloseTo(50)
  })

  it("is bounded at 100", () => {
    const results = [
      makeResult("openai", [
        { name: "HubSpot", normalizedName: "hubspot", mentions: 100 },
      ]),
    ]
    expect(visibilityPerLLM(results, "hubspot")).toBeLessThanOrEqual(100)
  })
})

describe("overallVisibility", () => {
  it("averages two LLM scores", () => {
    expect(overallVisibility(60, 40)).toBeCloseTo(50)
  })

  it("returns openai score when gemini failed", () => {
    expect(overallVisibility(70, null)).toBe(70)
  })

  it("returns gemini score when openai failed", () => {
    expect(overallVisibility(null, 80)).toBe(80)
  })

  it("returns 0 when both are null", () => {
    expect(overallVisibility(null, null)).toBe(0)
  })
})

describe("promptVisibility", () => {
  it("returns null when no mentions in prompt", () => {
    const result = makeResult("openai", [])
    expect(promptVisibility(result, "hubspot")).toBeNull()
  })

  it("calculates per-prompt share", () => {
    const result = makeResult("openai", [
      { name: "HubSpot", normalizedName: "hubspot", mentions: 3 },
      { name: "Salesforce", normalizedName: "salesforce", mentions: 1 },
    ])
    expect(promptVisibility(result, "hubspot")).toBeCloseTo(75)
  })

  it("returns 0 when target absent but others present", () => {
    const result = makeResult("openai", [
      { name: "Salesforce", normalizedName: "salesforce", mentions: 2 },
    ])
    expect(promptVisibility(result, "hubspot")).toBe(0)
  })
})

describe("mentionRate", () => {
  it("returns 0 with no prompts", () => {
    expect(mentionRate([], "hubspot")).toBe(0)
  })

  it("returns 100 when target appears in all prompts", () => {
    const promptResults = [
      [makeResult("openai", [{ name: "HubSpot", normalizedName: "hubspot", mentions: 1 }])],
      [makeResult("openai", [{ name: "HubSpot", normalizedName: "hubspot", mentions: 2 }])],
    ]
    expect(mentionRate(promptResults, "hubspot")).toBe(100)
  })

  it("returns 50 when target appears in half of prompts", () => {
    const promptResults = [
      [makeResult("openai", [{ name: "HubSpot", normalizedName: "hubspot", mentions: 1 }])],
      [makeResult("openai", [{ name: "Salesforce", normalizedName: "salesforce", mentions: 1 }])],
    ]
    expect(mentionRate(promptResults, "hubspot")).toBe(50)
  })
})

describe("marketShare", () => {
  it("returns empty array when no brands", () => {
    expect(marketShare([makeResult("openai", [])])).toEqual([])
  })

  it("returns single brand with 100% share", () => {
    const results = [
      makeResult("openai", [
        { name: "HubSpot", normalizedName: "hubspot", mentions: 5 },
      ]),
    ]
    const shares = marketShare(results)
    expect(shares).toHaveLength(1)
    expect(shares[0]!.share).toBeCloseTo(100)
  })

  it("groups top 8 and creates Other bucket", () => {
    const brands = Array.from({ length: 10 }, (_, i) => ({
      name: `Brand${i}`,
      normalizedName: `brand${i}`,
      mentions: 10 - i,
    }))
    const results = [makeResult("openai", brands)]
    const shares = marketShare(results)
    expect(shares).toHaveLength(9) // 8 + Other
    expect(shares[8]!.name).toBe("Other")
    // brands[8] has mentions=2, brands[9] has mentions=1 → Other = 3
    expect(shares[8]!.mentions).toBe(3)
  })

  it("sums mentions for same normalizedName across prompts", () => {
    const results = [
      makeResult("openai", [{ name: "HubSpot", normalizedName: "hubspot", mentions: 2 }]),
      makeResult("openai", [{ name: "HubSpot CRM", normalizedName: "hubspot", mentions: 3 }]),
    ]
    const shares = marketShare(results)
    expect(shares[0]!.mentions).toBe(5)
  })
})

describe("domainCitations", () => {
  it("returns empty for no citations", () => {
    expect(domainCitations([makeResult("openai", [])])).toEqual([])
  })

  it("deduplicates within a single prompt", () => {
    const result = makeResult("openai", [], [
      { url: "https://a.com/1", domain: "a.com", title: "" },
      { url: "https://a.com/2", domain: "a.com", title: "" },
    ])
    const citations = domainCitations([result])
    expect(citations).toHaveLength(1)
    expect(citations[0]!.count).toBe(1)
  })

  it("accumulates across multiple prompts", () => {
    const r1 = makeResult("openai", [], [
      { url: "https://a.com/1", domain: "a.com", title: "" },
    ])
    const r2 = makeResult("openai", [], [
      { url: "https://a.com/2", domain: "a.com", title: "" },
    ])
    const citations = domainCitations([r1, r2])
    expect(citations[0]!.count).toBe(2)
  })

  it("sorts by frequency descending", () => {
    const r1 = makeResult("openai", [], [
      { url: "https://b.com", domain: "b.com", title: "" },
    ])
    const r2 = makeResult("openai", [], [
      { url: "https://a.com/1", domain: "a.com", title: "" },
    ])
    const r3 = makeResult("openai", [], [
      { url: "https://a.com/2", domain: "a.com", title: "" },
    ])
    const citations = domainCitations([r1, r2, r3])
    expect(citations[0]!.domain).toBe("a.com")
    expect(citations[0]!.count).toBe(2)
  })
})
