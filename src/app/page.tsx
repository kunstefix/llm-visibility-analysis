export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-4xl font-bold tracking-tight">
        LLM Visibility Analysis
      </h1>
      <p className="text-muted-foreground max-w-md text-center">
        See where your website appears when buyers ask ChatGPT and Gemini.
      </p>
      <div className="w-full max-w-md rounded-md border px-4 py-2 text-muted-foreground text-sm">
        URL input — coming in Phase 2
      </div>
    </main>
  )
}
