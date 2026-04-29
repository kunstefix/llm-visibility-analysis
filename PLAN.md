# LLM Visibility Analysis Tool — Implementation Plan

## What It Does

User enters a URL. The tool scrapes the site, generates 5 buying-journey prompts, queries OpenAI (Responses API + `web_search`) and Gemini (`googleSearch` grounding) in parallel, extracts brand mentions via a cheap second-pass structured call, and renders a shareable dashboard with visibility scores, market share charts, and citation analysis.

## Current State

Pure Create Next App scaffold (Next.js 16.2.4, React 19.2, Tailwind v4). Nothing custom exists yet.

---

## Next.js 16 Breaking Changes — Apply Everywhere

- `params` and `searchParams` are Promises → always `await params`, `await searchParams`
- `cookies()`, `headers()`, `draftMode()` must be awaited
- Fetch is **not** cached by default
- Turbopack is default build tool (`next dev` uses it automatically)

---

## Phase Checklist

- [ ] Phase 1 — Skeleton
- [ ] Phase 2 — Scrape + Prompt Generation
- [ ] Phase 3 — LLM Orchestration
- [ ] Phase 4 — SSE Streaming
- [ ] Phase 5 — Aggregation + Persistence
- [ ] Phase 6 — Dashboard
- [ ] Phase 7 — Polish

Each phase ends with a `git commit`. Don't advance until `pnpm dev` runs cleanly and the current phase works end-to-end.

---

## Phase 1 — Skeleton

**Goal:** Everything compiles, routes exist as stubs, DB schema defined, env validated at startup.

### Steps

1. **Install dependencies:**
   ```bash
   pnpm add zod drizzle-orm @neondatabase/serverless pino openai @google/generative-ai cheerio
   pnpm add -D drizzle-kit vitest @vitejs/plugin-react @types/pino
   pnpm dlx shadcn@latest init          # New York style, Zinc base color
   pnpm dlx shadcn@latest add button input card badge accordion progress separator
   pnpm add recharts
   ```

2. **`lib/env.ts`** — Zod-parsed env, all 5 vars required, fail-fast at import.

3. **`lib/logger.ts`** — pino instance, log level from `NODE_ENV`.

4. **`lib/db/schema.ts`** — Drizzle schema: `reports`, `prompts`, `promptResults` with enums.

5. **`lib/db/client.ts`** — Single Neon Postgres client.

6. **`lib/db/queries.ts`** — Empty placeholder exports.

7. **`drizzle.config.ts`** — Points at schema, uses `env.DATABASE_URL`.

8. **`lib/validation.ts`** — `UrlInputSchema` (http/https, real domain, SSRF blocklist), `ReportIdSchema` (uuid).

9. **Route stubs** (minimal valid responses):
   - `app/api/analyze/route.ts` — POST stub
   - `app/api/report/[id]/route.ts` — GET stub
   - `app/analyze/page.tsx` — `'use client'` stub
   - `app/report/[id]/page.tsx` — async server component with `await params`
   - `app/not-found.tsx`

10. **`app/layout.tsx`** — Keep Geist fonts, add `<main>` wrapper.

11. **`app/page.tsx`** — Landing stub: headline + URL input placeholder.

12. **`.env.example`** — All 5 vars with empty values.

13. **`vitest.config.ts`** — Basic config with path aliases.

14. **`pnpm drizzle-kit push`** — Create tables in Neon.

**Commit:** `feat: phase 1 — skeleton, schema, env, route stubs`

---

## Phase 2 — Scrape + Prompt Generation

**Files:** `lib/scrape.ts`, `lib/prompts/templates.ts`, `lib/prompts/generate.ts`, `tests/prompts.test.ts`

### `lib/scrape.ts`

- SSRF guard: validate scheme, resolve hostname, reject private/link-local IPs, 10s timeout, 2MB cap
- Cheerio: extract title, description, h1s (first 3), og:title, og:description
- Jina Reader fallback: `GET https://r.jina.ai/{url}` if Cheerio yields < 100 chars
- Return: `{ url, domain, brandName, title, description, h1s, ogTags }`
- `brandName` heuristic: og:site_name → title word before first `|` or `–` → domain TLD-stripped

### `lib/prompts/templates.ts`

Five exported template strings for stages: `awareness`, `consideration`, `decision`, `problem`, `solution`. Each has `{{brandCategory}}` and `{{context}}` placeholders (≤ 80 tokens).

### `lib/prompts/generate.ts`

- Cheap gpt-4o-mini call to infer `brandCategory` from scraped context
- Interpolate each template → 5 Prompt objects with stage labels

### Temporary `/api/analyze`

Plain JSON POST: `{ url } → { scrapedContext, prompts }` (no streaming yet).

**Commit:** `feat: phase 2 — scrape and prompt generation`

---

## Phase 3 — LLM Orchestration

**Files:** `lib/llm/types.ts`, `lib/llm/openai.ts`, `lib/llm/gemini.ts`, `lib/llm/extract-brands.ts`, `scripts/test-run.ts`

### `lib/llm/types.ts`

```ts
type LLMResult = {
  provider: 'openai' | 'gemini'
  answerText: string
  brands: { name: string; normalizedName: string; mentions: number }[]
  citations: { url: string; domain: string; title: string }[]
  durationMs: number
  rawResponse: unknown
  errorMessage?: string
}
```

### `lib/llm/openai.ts`

- Responses API, `web_search` tool, model `gpt-4o`, 30s timeout
- Parse `url_citation` annotations for citations
- Log: provider, prompt id, duration, token usage, success/failure

### `lib/llm/gemini.ts`

- `gemini-2.0-flash`, `googleSearch` grounding, 30s timeout
- Parse `groundingMetadata.groundingChunks` for citations

### `lib/llm/extract-brands.ts`

- Input: `answerText`; model: `gpt-4o-mini` structured output
- Strict Zod schema: `{ brands: [{ name, mentions }] }`
- `safeParse` with one retry on bad JSON
- Always runs on BOTH providers' answer text

### Verification

```bash
pnpm tsx scripts/test-run.ts https://example.com
```

**Commit:** `feat: phase 3 — LLM orchestration and brand extraction`

---

## Phase 4 — SSE Streaming

**Files:** `app/api/analyze/route.ts` (full), `hooks/use-analyze.ts`, `app/analyze/page.tsx`, `components/url-form.tsx`, `components/analyze/stage-stepper.tsx`, `components/analyze/prompt-card.tsx`, `components/analyze/result-cell.tsx`, `app/page.tsx`

### SSE Event Schema

```
{ type: 'stage', stage: string }
{ type: 'prompts', prompts: Prompt[] }
{ type: 'prompt-complete', promptIndex: number, provider: string, result: LLMResult }
{ type: 'done', reportId: string }
{ type: 'error', message: string }
```

### `/api/analyze/route.ts`

1. Validate body with `UrlInputSchema`
2. Rate limit: count rows by `ipHash` in last 24h; 429 if ≥ 3
3. Return `ReadableStream` with headers:
   - `Cache-Control: no-cache, no-transform`
   - `X-Accel-Buffering: no`
   - `Content-Type: text/event-stream`
   - `Connection: keep-alive`
4. Emit stage events as pipeline progresses
5. All 10 LLM calls via `Promise.allSettled` — each emits `prompt-complete` on resolve
6. 15s heartbeat (`: ping\n\n`)
7. `controller.close()` in `finally`
8. Propagate `req.signal` for cancellation

### `hooks/use-analyze.ts`

POST-based `fetch` + `ReadableStream` reader (not native `EventSource`). Buffers incomplete SSE lines. Exposes: `{ stage, prompts, results, status, error, cancel }`.

### `/analyze` page

- Header: URL, elapsed timer, Cancel button
- `<StageStepper>`: Scraping → Generating prompts → Querying LLMs → Aggregating
- Prompts panel: 5 `<PromptCard>` with stage badges, appears on `prompts` event
- Results grid: 2 cols × 5 rows; skeleton until `prompt-complete` fills cell
- On `done`: "Report ready" flash → `router.push('/report/[id]')`
- Per-cell error state if a prompt-provider pair failed

**Commit:** `feat: phase 4 — SSE streaming and live progress UI`

---

## Phase 5 — Aggregation + Persistence

**Files:** `lib/normalize.ts`, `lib/scoring.ts`, `lib/db/queries.ts` (implement), `app/api/analyze/route.ts` (add DB write), `tests/normalize.test.ts`, `tests/scoring.test.ts`

### `lib/normalize.ts`

- `normalizeBrand(name: string): string` — 7-step normalization (see PROJECT_BRIEF.md §Brand normalization)
  - Never strip below 2 chars; never strip if suffix is the only token
- `normalizeDomain(url: string): string` — `URL.hostname` then strip leading `www.`

### `lib/scoring.ts`

Pure exported functions:

| Function | Formula |
|---|---|
| `visibilityPerLLM` | target mentions / all mentions × 100, bounded 0–100, 0 if total = 0 |
| `overallVisibility` | mean of both LLM scores; if one failed, return the working score unchanged |
| `promptVisibility` | target / total × 100; return `null` if total = 0 |
| `mentionRate` | prompts with target mention / total prompts × 100 |
| `marketShare` | per-brand share, top 8 + Other bucket |
| `domainCitations` | per-domain count; within-prompt dedup, across-prompt accumulation |

### DB writes (end of stream)

Insert `report` → insert 5 `prompts` → insert up to 10 `promptResults`. Emit `done` with `reportId`. If ALL LLM calls failed, skip DB write, emit `error`.

### Tests

All fixtures from PROJECT_BRIEF.md §Test fixtures must pass.

**Commit:** `feat: phase 5 — scoring, normalization, persistence`

---

## Phase 6 — Dashboard

**Files:** `app/report/[id]/page.tsx`, `app/api/report/[id]/route.ts`, `lib/db/queries.ts` (add `getReport`), `components/dashboard/*`

### `/report/[id]` Server Component

`const { id } = await params` → fetch from Postgres → `notFound()` if missing → pass data to children.

### Dashboard Sections (in order)

1. **Hero** — overall visibility score (big), per-LLM scores, mention rate, missing-provider flag
2. **Comparison chart** — Recharts grouped bar: 4 metrics × 2 providers
3. **Market share** — two `<PieChart>`, target brand highlighted; expandable full table below each
4. **Citation analysis** — favicons (`https://www.google.com/s2/favicons?domain={d}&sz=64`), frequency, per-LLM badge
5. **Per-prompt accordion** — shadcn Accordion; answer text side-by-side with inline brand highlighting
6. **Recommendations** — 3–5 actions from cheap LLM call grounded in citation gaps
7. **Share / re-run footer** — copy-link, "Run again" → `/`

**Commit:** `feat: phase 6 — report dashboard`

---

## Phase 7 — Polish

- Rate limit feedback on landing (429 → human-readable message)
- Empty states: brand never mentioned, all LLMs failed, one LLM failed
- Mobile layout audit
- SSRF guard hardening: re-check resolved IP post-redirect, add metadata IP ranges
- `not-found.tsx` — proper 404 with back link
- `README.md` — note on visibility score formula deviation from original spec
- `pnpm build` must pass with zero TypeScript errors

**Commit:** `feat: phase 7 — polish, error states, mobile, README`

---

## Verification

After each phase:

```bash
pnpm dev          # must start cleanly
pnpm tsc --noEmit # zero type errors
pnpm vitest run   # all tests pass (phases 5+)
pnpm build        # must succeed before final commit
```

Phase 3 verification:
```bash
pnpm tsx scripts/test-run.ts https://example.com
```

---

## Critical Files Reference

| Path | Purpose |
|---|---|
| `lib/env.ts` | Fail-fast env — import first in all server code |
| `lib/db/schema.ts` | DB shape source of truth |
| `lib/normalize.ts` | Brand + domain normalization — pure, fully tested |
| `lib/scoring.ts` | All scoring formulas — pure, fully tested |
| `lib/llm/extract-brands.ts` | Two-pass brand extraction via gpt-4o-mini |
| `app/api/analyze/route.ts` | SSE stream — most complex file |
| `hooks/use-analyze.ts` | SSE consumer with cancellation |
| `app/report/[id]/page.tsx` | Dashboard server component |
| `tests/scoring.test.ts` | Unit tests for all formulas |
