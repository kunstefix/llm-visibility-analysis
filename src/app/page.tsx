import { UrlForm } from "@/components/url-form"

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-4 py-16">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          LLM Visibility Analysis
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Enter your website URL to see how it appears in ChatGPT and Gemini
          for buying-journey queries.
        </p>
      </div>

      <UrlForm />

      {/* Explainer */}
      <div className="flex flex-col items-center gap-6 max-w-2xl w-full">
        <div className="grid gap-4 sm:grid-cols-3 w-full text-center text-sm">
          {[
            {
              step: "1",
              title: "We generate 5 prompts",
              body: "Covering awareness, consideration, decision, problem, and solution stages.",
            },
            {
              step: "2",
              title: "We ask both LLMs",
              body: "ChatGPT and Gemini with live web search enabled so citations are real.",
            },
            {
              step: "3",
              title: "You see where you appear",
              body: "Visibility score, market share, citation sources, and actionable recommendations.",
            },
          ].map(({ step, title, body }) => (
            <div key={step} className="flex flex-col gap-2 rounded-lg border p-4">
              <div className="text-2xl font-bold text-muted-foreground">{step}</div>
              <p className="font-semibold">{title}</p>
              <p className="text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Free · No account required · 3 analyses per day per IP
        </div>
      </div>
    </main>
  )
}
