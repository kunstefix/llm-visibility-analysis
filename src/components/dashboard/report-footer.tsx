"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function ReportFooter() {
  function copyLink() {
    navigator.clipboard.writeText(window.location.href).catch(() => {})
  }

  return (
    <footer className="flex items-center justify-between gap-4 border-t pt-6">
      <Button variant="outline" size="sm" onClick={copyLink} className="cursor-pointer">
        Copy link
      </Button>
      <Button asChild size="sm">
        <Link href="/" className="cursor-pointer">
          Run again →
        </Link>
      </Button>
    </footer>
  )
}
