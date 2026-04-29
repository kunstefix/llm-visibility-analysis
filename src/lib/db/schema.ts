import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  jsonb,
  integer,
} from "drizzle-orm/pg-core"

export const reportStatusEnum = pgEnum("report_status", [
  "completed",
  "failed",
])

export const promptStageEnum = pgEnum("prompt_stage", [
  "awareness",
  "consideration",
  "decision",
  "problem",
  "solution",
])

export const providerEnum = pgEnum("provider", ["openai", "gemini"])

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  url: text("url").notNull(),
  domain: text("domain").notNull(),
  brandName: text("brand_name").notNull(),
  scrapedContext: jsonb("scraped_context").notNull(),
  status: reportStatusEnum("status").notNull(),
  ipHash: text("ip_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const prompts = pgTable("prompts", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportId: uuid("report_id")
    .notNull()
    .references(() => reports.id),
  text: text("text").notNull(),
  stage: promptStageEnum("stage").notNull(),
  order: integer("order").notNull(),
})

export const promptResults = pgTable("prompt_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  promptId: uuid("prompt_id")
    .notNull()
    .references(() => prompts.id),
  provider: providerEnum("provider").notNull(),
  rawResponse: jsonb("raw_response"),
  answerText: text("answer_text"),
  brands: jsonb("brands"),
  citations: jsonb("citations"),
  durationMs: integer("duration_ms"),
  errorMessage: text("error_message"),
})
