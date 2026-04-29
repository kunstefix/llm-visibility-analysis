export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Report {id}</p>
    </div>
  )
}
