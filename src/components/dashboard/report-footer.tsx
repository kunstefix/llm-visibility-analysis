"use client"

import Link from "next/link"

export function ReportFooter() {
  return (
    <footer className="flex items-center justify-between gap-4 border-t pt-6 text-sm">
      <button
        onClick={() => {
          navigator.clipboard.writeText(window.location.href).catch(() => {})
        }}
        className="text-muted-foreground underline"
      >
        Copy link
      </button>
      <Link href="/" className="underline">
        Run again
      </Link>
    </footer>
  )
}
