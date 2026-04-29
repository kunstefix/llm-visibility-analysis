import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 font-semibold tracking-tight hover:opacity-80 transition-opacity cursor-pointer"
        >
          <span className="text-foreground">LLM</span>
          <span className="font-normal text-muted-foreground">Visibility</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            New Analysis
          </Link>
        </div>
      </div>
    </header>
  )
}
