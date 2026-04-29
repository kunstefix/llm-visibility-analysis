import { describe, it, expect } from "vitest"
import { normalizeBrand, normalizeDomain } from "@/lib/normalize"

describe("normalizeBrand", () => {
  it("lowercases and trims", () => {
    expect(normalizeBrand("  HubSpot  ")).toBe("hubspot")
  })

  it("strips .com TLD", () => {
    expect(normalizeBrand("salesforce.com")).toBe("salesforce")
  })

  it("strips .io TLD", () => {
    expect(normalizeBrand("linear.io")).toBe("linear")
  })

  it("strips .ai TLD", () => {
    expect(normalizeBrand("jasper.ai")).toBe("jasper")
  })

  it("strips legal suffix inc", () => {
    expect(normalizeBrand("Salesforce Inc")).toBe("salesforce")
  })

  it("strips legal suffix inc with dot", () => {
    expect(normalizeBrand("Salesforce Inc.")).toBe("salesforce")
  })

  it("strips legal suffix llc", () => {
    expect(normalizeBrand("Acme LLC")).toBe("acme")
  })

  it("strips legal suffix corp", () => {
    expect(normalizeBrand("Microsoft Corp")).toBe("microsoft")
  })

  it("strips product suffix crm", () => {
    expect(normalizeBrand("HubSpot CRM")).toBe("hubspot")
  })

  it("strips product suffix software", () => {
    expect(normalizeBrand("Salesforce Software")).toBe("salesforce")
  })

  it("strips product suffix platform", () => {
    expect(normalizeBrand("Marketo Platform")).toBe("marketo")
  })

  it("does not strip suffix if result would be under 2 chars", () => {
    // "AI" stripped of nothing substantial — "Ai inc" → "ai" (2 chars), ok
    // "Co Inc" → stripping "inc" → "co" → 2 chars: should keep
    const result = normalizeBrand("Co Inc")
    expect(result.length).toBeGreaterThanOrEqual(2)
  })

  it("does not strip suffix if it is the only token", () => {
    expect(normalizeBrand("Suite")).toBe("suite")
  })

  it("handles URL form input", () => {
    expect(normalizeBrand("https://www.hubspot.com/crm")).toBe("hubspot")
  })

  it("handles URL without path", () => {
    expect(normalizeBrand("https://linear.io")).toBe("linear")
  })

  it("collapses internal whitespace", () => {
    expect(normalizeBrand("Acme   Corp")).toBe("acme")
  })

  it("handles mixed case brand", () => {
    expect(normalizeBrand("ZenDesk")).toBe("zendesk")
  })

  it("preserves brand that is only a short name", () => {
    expect(normalizeBrand("Zoom")).toBe("zoom")
  })
})

describe("normalizeDomain", () => {
  it("extracts hostname from full URL", () => {
    expect(normalizeDomain("https://www.hubspot.com/products")).toBe(
      "hubspot.com"
    )
  })

  it("strips www prefix", () => {
    expect(normalizeDomain("https://www.google.com")).toBe("google.com")
  })

  it("returns bare domain without www", () => {
    expect(normalizeDomain("https://linear.io")).toBe("linear.io")
  })

  it("handles malformed URL gracefully", () => {
    const result = normalizeDomain("not-a-url")
    expect(typeof result).toBe("string")
  })
})
