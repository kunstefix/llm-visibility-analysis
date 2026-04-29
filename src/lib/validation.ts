import { z } from "zod"

const PRIVATE_IP_PATTERNS = [
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^127\.\d+\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/,
  /^100\.6[4-9]\.\d+\.\d+$/,
  /^100\.[7-9]\d\.\d+\.\d+$/,
  /^100\.1[01]\d\.\d+\.\d+$/,
  /^100\.12[0-7]\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^fc[0-9a-f]{2}:/i,
  /^fd[0-9a-f]{2}:/i,
  /^fe80:/i,
]

function isPrivateAddress(hostname: string): boolean {
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname))
}

export const UrlInputSchema = z
  .string()
  .url()
  .refine(
    (url) => {
      try {
        const parsed = new URL(url)
        return parsed.protocol === "http:" || parsed.protocol === "https:"
      } catch {
        return false
      }
    },
    { message: "URL must use http or https" }
  )
  .refine(
    (url) => {
      try {
        const parsed = new URL(url)
        const hostname = parsed.hostname
        if (hostname === "localhost") return false
        if (isPrivateAddress(hostname)) return false
        const parts = hostname.split(".")
        return parts.length >= 2 && parts.every((p) => p.length > 0)
      } catch {
        return false
      }
    },
    { message: "URL must point to a public domain" }
  )

export const ReportIdSchema = z.string().uuid()
