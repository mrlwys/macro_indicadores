import { config as loadDotEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const envCandidates = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../.env"),
];

for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    loadDotEnv({ path: envPath, override: false });
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_SCHEMA: z.string().default("public"),
  SYNC_SECRET: z.string().optional(),
  SYNC_LOCK_TTL_MINUTES: z.coerce.number().int().positive().default(30),
  JWT_SECRET: z.string().default("change-me-in-production"),
  JWT_EXPIRES_IN: z.string().default("12h"),
  NOMUS_SYNC_ENABLED: z
    .string()
    .default("false")
    .transform((value) => value.toLowerCase() === "true"),
  NOMUS_BASE_URL: z.string().url().default("https://empresa.nomus.com.br/empresa/rest"),
  NOMUS_INTEGRATION_KEY: z.string().optional(),
  NOMUS_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  NOMUS_MAX_RETRIES: z.coerce.number().int().nonnegative().default(5),
  NOMUS_BACKOFF_BASE_MS: z.coerce.number().int().positive().default(1000),
  NOMUS_BACKOFF_MAX_MS: z.coerce.number().int().positive().default(30000),
  NOMUS_THROTTLE_MAX_WAIT_MS: z.coerce.number().int().positive().default(180000),
  NOMUS_SYNC_INTERVAL_MINUTES: z.coerce.number().int().positive().default(10),
  NOMUS_INITIAL_BACKFILL_DAYS: z.coerce.number().int().positive().default(365),
  NOMUS_INCREMENTAL_LOOKBACK_DAYS: z.coerce.number().int().nonnegative().default(7),
  NOMUS_INCREMENTAL_LOOKBACK_PAGES: z.coerce.number().int().nonnegative().default(3),
  NOMUS_PAGE_START: z.coerce.number().int().positive().default(1),
  NOMUS_MAX_PAGES_PER_RUN: z.coerce.number().int().positive().default(200),
  NOMUS_ENABLED_ENDPOINTS: z
    .string()
    .default("propostas,pedidos,contasReceber,processos,ordens")
    .transform((value) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
});

export const env = envSchema.parse(process.env);
