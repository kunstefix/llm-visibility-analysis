export type BrandMention = {
  name: string
  normalizedName: string
  mentions: number
}

export type Citation = {
  url: string
  domain: string
  title: string
}

export type LLMResult = {
  provider: "openai" | "gemini"
  answerText: string
  brands: BrandMention[]
  citations: Citation[]
  durationMs: number
  rawResponse: unknown
  errorMessage?: string
}
