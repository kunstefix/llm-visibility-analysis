import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        404
      </p>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The report you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <Link
        href="/"
        className="mt-2 cursor-pointer text-sm underline underline-offset-4 hover:text-muted-foreground transition-colors"
      >
        ← Back to home
      </Link>
    </div>
  )
}
