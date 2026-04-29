import { type NextRequest } from "next/server"
import { ReportIdSchema } from "@/lib/validation"
import { getReport } from "@/lib/db/queries"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const parsed = ReportIdSchema.safeParse(id)
  if (!parsed.success) {
    return Response.json({ error: "Invalid report ID" }, { status: 400 })
  }

  const report = await getReport(parsed.data).catch(() => null)
  if (!report) {
    return Response.json({ error: "Report not found" }, { status: 404 })
  }

  return Response.json(report)
}
