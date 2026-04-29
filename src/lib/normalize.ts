const LEGAL_SUFFIXES = /\b(inc\.?|llc|co\.?|corp\.?|ltd\.?|gmbh|s\.a\.r?\.l\.?)\s*$/i

const PRODUCT_SUFFIXES =
  /\b(crm|software|platform|app|tools?|suite)\s*$/i

const TLDS = /\.(com|io|ai|co|org|net|app|dev|xyz)\b/g

const URL_PREFIXES = /^https?:\/\/(www\.)?/i

export function normalizeBrand(name: string): string {
  let s = name

  // strip URL prefix/paths/query
  if (/^https?:\/\//i.test(s)) {
    try {
      s = new URL(s).hostname
    } catch {
      s = s.replace(URL_PREFIXES, "")
    }
  }

  // Step 1-2: lowercase + trim
  s = s.toLowerCase().trim()

  // Step 3: strip www.
  s = s.replace(/^www\./, "")

  // Step 4: strip TLDs and path
  s = s.replace(/\/.*$/, "") // strip path
  s = s.replace(TLDS, "")

  // Step 5: strip legal suffixes (only if ≥ 2 chars remain after)
  s = stripSuffix(s, LEGAL_SUFFIXES)

  // Step 6: strip product-line suffixes
  s = stripSuffix(s, PRODUCT_SUFFIXES)

  // Step 7: collapse whitespace
  s = s.replace(/\s+/g, " ").trim()

  return s
}

function stripSuffix(s: string, pattern: RegExp): string {
  const match = s.match(pattern)
  if (!match) return s
  const stripped = s.slice(0, match.index).trim()
  if (stripped.length < 2) return s
  return stripped
}

export function normalizeDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url.replace(/^www\./, "")
  }
}
