import { type NextRequest } from "next/server"

export async function POST(_req: NextRequest) {
  return Response.json({ ok: true })
}
