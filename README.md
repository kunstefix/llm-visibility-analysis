# LLM Visibility Analysis

Enter a website URL to see how it appears in ChatGPT and Gemini for buying-journey queries. The tool generates 5 prompts covering awareness, consideration, decision, problem, and solution stages, queries both LLMs with live web search, extracts brand mentions, and renders a dashboard with visibility scores, market share, and citation sources.

## Tech stack

Next.js 16 (App Router) · TypeScript strict · Tailwind CSS + shadcn/ui · Recharts · Zod · Drizzle ORM + Neon Postgres · SSE · OpenAI Responses API · Google Gemini API · Cheerio + Jina Reader · pino · Vitest

## Setup

```bash
cp .env.example .env.local
# Fill in all 5 vars in .env.local

pnpm install
pnpm db:push        # creates tables in Neon
pnpm dev
```

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `OPENAI_API_KEY` | OpenAI API key |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API key |
| `RATE_LIMIT_SALT` | Random string for HMAC IP hashing |
| `NODE_ENV` | `development` \| `production` |

## Running tests

```bash
pnpm test
```

## Visibility score formula

The report shows "visibility score" as the **share of voice** of the target brand across all LLM responses:

```
visibilityPerLLM = (target brand mentions across all prompts)
                / (all brand mentions across all prompts)
                × 100
```

The original product spec defined this as `mentions / unique_brands × 100`, which is not bounded by 100% and conflates count with cardinality. The share-of-voice formulation is the standard industry interpretation.

## Architecture notes

- **Two-pass extraction.** Web-grounded LLM call first, then a cheap `gpt-4o-mini` structured-output call to extract brand mentions as JSON. The answering model doesn't need to do both jobs.
- **SSE not WebSocket.** POST-based `fetch` + `ReadableStream` on the client for abort support. 15s heartbeat keeps proxies alive.
- **All 10 LLM calls in parallel.** Each emits its own SSE event the moment it completes, so the UI fills in out of order.
- **Postgres rate limiting.** Queries `reports` table by `ipHash` in a 24h window. 3 analyses per IP per day.
- **Raw LLM responses stored.** The full payload is in `promptResults.rawResponse` so aggregation logic can be improved without re-paying for inference.
