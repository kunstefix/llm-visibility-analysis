import { UrlForm } from "@/components/url-form"

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-12 px-4 py-16">
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
          Free · No account required
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          How visible is your brand<br className="hidden sm:block" /> to AI assistants?
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Enter your website URL to see how ChatGPT and Gemini mention you
          across the buying journey.
        </p>
      </div>

      <UrlForm />

      <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-3">
        {[
          {
            step: "1",
            title: "Generate 5 prompts",
            body: "Covering awareness, consideration, decision, problem, and solution stages.",
          },
          {
            step: "2",
            title: "Query both LLMs",
            body: "ChatGPT and Gemini with live web search — citations are real.",
          },
          {
            step: "3",
            title: "Get your report",
            body: "Visibility score, market share, citation sources, and recommendations.",
          },
        ].map(({ step, title, body }) => (
          <div key={step} className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {step}
            </div>
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
