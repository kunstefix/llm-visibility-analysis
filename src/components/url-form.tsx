"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UrlInputSchema } from "@/lib/validation"

export function UrlForm() {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isValid = UrlInputSchema.safeParse(value).success

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = UrlInputSchema.safeParse(value)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid URL")
      return
    }
    setError(null)
    startTransition(() => {
      router.push(`/analyze?url=${encodeURIComponent(parsed.data)}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl flex-col gap-2">
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://yoursite.com"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(null)
          }}
          className="h-11 flex-1 text-base"
          disabled={isPending}
          aria-label="Website URL"
          autoFocus
        />
        <Button
          type="submit"
          disabled={!isValid || isPending}
          className="h-11 cursor-pointer px-6"
        >
          {isPending ? "Starting…" : "Analyze →"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  )
}
