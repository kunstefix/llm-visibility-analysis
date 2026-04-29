import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
  RATE_LIMIT_SALT: z.string().min(1),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
})

type Env = z.infer<typeof envSchema>

// Lazy validation: throws on first access at runtime, not at module import time.
// This keeps the fail-fast guarantee while allowing Next.js to import the module
// during build without requiring env vars in CI.
let _parsed: Env | undefined

function getEnv(): Env {
  if (!_parsed) {
    _parsed = envSchema.parse(process.env)
  }
  return _parsed
}

export const env: Env = new Proxy({} as Env, {
  get(_, key: string) {
    return getEnv()[key as keyof Env]
  },
})
