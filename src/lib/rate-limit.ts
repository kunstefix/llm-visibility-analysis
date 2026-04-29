import crypto from "crypto"
import { env } from "@/lib/env"
import { countRecentByIp } from "@/lib/db/queries"

const WINDOW_MS = 24 * 60 * 60 * 1000
const MAX_PER_WINDOW = 3

export function hashIp(ip: string): string {
  return crypto
    .createHmac("sha256", env.RATE_LIMIT_SALT)
    .update(ip)
    .digest("hex")
}

export async function isRateLimited(ip: string): Promise<boolean> {
  const ipHash = hashIp(ip)
  const count = await countRecentByIp(ipHash, WINDOW_MS)
  return count >= MAX_PER_WINDOW
}
