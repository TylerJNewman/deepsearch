import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    REDIS_URL: z.string().url(),
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    AUTH_DISCORD_ID: z.string(),
    AUTH_DISCORD_SECRET: z.string(),
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string(),
    TAVILY_API_KEY: z.string(),
    LANGFUSE_SECRET_KEY: z.string(),
    LANGFUSE_PUBLIC_KEY: z.string(),
    LANGFUSE_BASEURL: z.string().url(),
    EVAL_DATASET: z.enum(["dev", "ci", "regression"]).optional().default("dev"),
    SEARCH_RESULTS_COUNT: z.coerce.number().default(10),
    MAX_STEPS: z.coerce.number().default(10),
    DEFAULT_SEARCH_DEPTH: z.enum(["basic", "advanced"]).default("advanced"),
    DEFAULT_FRESHNESS_TIME_RANGE: z
      .enum(["day", "week", "month", "year"])
      .default("month"),
    DEFAULT_SCRAPER_MAX_RETRIES: z.coerce.number().default(3),
    DAILY_REQUEST_LIMIT: z.coerce.number().default(50),
    GLOBAL_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(1),
    GLOBAL_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(5000),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {},

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    REDIS_URL: process.env.REDIS_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_DISCORD_ID: process.env.AUTH_DISCORD_ID,
    AUTH_DISCORD_SECRET: process.env.AUTH_DISCORD_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY,
    LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY,
    LANGFUSE_BASEURL: process.env.LANGFUSE_BASEURL,
    EVAL_DATASET: process.env.EVAL_DATASET,
    SEARCH_RESULTS_COUNT: process.env.SEARCH_RESULTS_COUNT,
    MAX_STEPS: process.env.MAX_STEPS,
    DEFAULT_SEARCH_DEPTH: process.env.DEFAULT_SEARCH_DEPTH,
    DEFAULT_FRESHNESS_TIME_RANGE: process.env.DEFAULT_FRESHNESS_TIME_RANGE,
    DEFAULT_SCRAPER_MAX_RETRIES: process.env.DEFAULT_SCRAPER_MAX_RETRIES,
    DAILY_REQUEST_LIMIT: process.env.DAILY_REQUEST_LIMIT,
    GLOBAL_RATE_LIMIT_MAX_REQUESTS: process.env.GLOBAL_RATE_LIMIT_MAX_REQUESTS,
    GLOBAL_RATE_LIMIT_WINDOW_MS: process.env.GLOBAL_RATE_LIMIT_WINDOW_MS,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
