import * as cheerio from "cheerio"
import { logger } from "@/lib/logger"

const FETCH_TIMEOUT_MS = 10_000
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024

const PRIVATE_IP_RE = [
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^127\.\d+\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^fc[0-9a-f]{2}:/i,
  /^fd[0-9a-f]{2}:/i,
  /^fe80:/i,
]

function isPrivate(hostname: string): boolean {
  return PRIVATE_IP_RE.some((re) => re.test(hostname))
}

function assertPublicUrl(url: URL): void {
  const h = url.hostname
  if (h === "localhost" || isPrivate(h)) {
    throw new Error(`SSRF: blocked hostname ${h}`)
  }
}

export type ScrapedContext = {
  url: string
  domain: string
  brandName: string
  title: string
  description: string
  h1s: string[]
  ogTags: Record<string, string>
}

function stripTld(domain: string): string {
  return domain.replace(/\.(com|io|ai|co|org|net|app|dev|xyz|co\.\w{2})$/, "")
}

function inferBrandName(
  ogSiteName: string | undefined,
  title: string,
  domain: string
): string {
  if (ogSiteName?.trim()) return ogSiteName.trim()

  const separators = /[|\-–—•·]/
  if (separators.test(title)) {
    const part = title.split(separators)[0].trim()
    if (part.length >= 2) return part
  }

  const bare = stripTld(domain.replace(/^www\./, ""))
  return bare.charAt(0).toUpperCase() + bare.slice(1)
}

async function scrapeWithCheerio(
  url: URL,
  signal: AbortSignal
): Promise<ScrapedContext | null> {
  const timeoutSignal = AbortSignal.timeout(FETCH_TIMEOUT_MS)
  const combined = AbortSignal.any([signal, timeoutSignal])

  const res = await fetch(url.toString(), {
    signal: combined,
    headers: { "User-Agent": "LLMVisibilityBot/1.0" },
  })

  if (!res.ok) return null

  const contentLength = Number(res.headers.get("content-length") ?? 0)
  if (contentLength > MAX_RESPONSE_BYTES) return null

  const html = await res.text()
  if (html.length > MAX_RESPONSE_BYTES) return null

  const $ = cheerio.load(html)

  const title = $("title").first().text().trim()
  const description =
    $('meta[name="description"]').attr("content")?.trim() ??
    $('meta[property="og:description"]').attr("content")?.trim() ??
    ""
  const h1s = $("h1")
    .slice(0, 3)
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
  const ogSiteName = $('meta[property="og:site_name"]').attr("content")?.trim()
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim() ?? ""
  const ogDescription =
    $('meta[property="og:description"]').attr("content")?.trim() ?? ""

  const domain = url.hostname.replace(/^www\./, "")
  const brandName = inferBrandName(ogSiteName, title || ogTitle, domain)

  const text = [title, description, ...h1s].join(" ").trim()
  if (text.length < 50) return null

  return {
    url: url.toString(),
    domain,
    brandName,
    title: title || ogTitle,
    description: description || ogDescription,
    h1s,
    ogTags: {
      ...(ogSiteName ? { "og:site_name": ogSiteName } : {}),
      ...(ogTitle ? { "og:title": ogTitle } : {}),
      ...(ogDescription ? { "og:description": ogDescription } : {}),
    },
  }
}

async function scrapeWithJina(
  url: URL,
  signal: AbortSignal
): Promise<ScrapedContext | null> {
  const jinaUrl = `https://r.jina.ai/${url.toString()}`
  const timeoutSignal = AbortSignal.timeout(FETCH_TIMEOUT_MS)
  const combined = AbortSignal.any([signal, timeoutSignal])

  const res = await fetch(jinaUrl, {
    signal: combined,
    headers: { "User-Agent": "LLMVisibilityBot/1.0" },
  })

  if (!res.ok) return null

  const text = await res.text()
  if (text.length < 50) return null

  const domain = url.hostname.replace(/^www\./, "")
  const brandName = inferBrandName(undefined, "", domain)

  const lines = text.split("\n").filter(Boolean)
  const title = lines[0]?.replace(/^#\s*/, "").trim() ?? ""
  const description = lines.slice(1, 3).join(" ").trim()

  return {
    url: url.toString(),
    domain,
    brandName,
    title,
    description,
    h1s: [],
    ogTags: {},
  }
}

export async function scrapeUrl(
  rawUrl: string,
  signal: AbortSignal
): Promise<ScrapedContext> {
  const url = new URL(rawUrl)
  assertPublicUrl(url)

  const start = Date.now()

  let result = await scrapeWithCheerio(url, signal).catch((err) => {
    logger.warn({ err, url: rawUrl }, "cheerio scrape failed, trying jina")
    return null
  })

  if (!result) {
    result = await scrapeWithJina(url, signal).catch((err) => {
      logger.warn({ err, url: rawUrl }, "jina scrape failed")
      return null
    })
  }

  if (!result) {
    throw new Error(`Could not scrape content from ${rawUrl}`)
  }

  logger.debug(
    { url: rawUrl, durationMs: Date.now() - start },
    "scrape complete"
  )

  return result
}
