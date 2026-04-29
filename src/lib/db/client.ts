import { neon } from "@neondatabase/serverless"
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http"
import { env } from "@/lib/env"
import * as schema from "./schema"

type DB = NeonHttpDatabase<typeof schema>

let _db: DB | undefined

function getDb(): DB {
  if (!_db) {
    const sql = neon(env.DATABASE_URL)
    _db = drizzle(sql, { schema })
  }
  return _db
}

export const db: DB = new Proxy({} as DB, {
  get(_, key: string | symbol) {
    return getDb()[key as keyof DB]
  },
})
