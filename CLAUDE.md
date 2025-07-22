# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Primary Commands:**
```bash
pnpm dev          # Start development server with Turbo
pnpm build        # Build for production
pnpm start        # Start production server
pnpm preview      # Build and start production preview
```

**Quality Assurance:**
```bash
pnpm check        # Run lint + typecheck together
pnpm lint         # ESLint checking
pnpm lint:fix     # Fix ESLint issues automatically
pnpm typecheck    # TypeScript type checking
pnpm format:write # Format code with Prettier
pnpm format:check # Check code formatting
```

**Database Management:**
```bash
pnpm db:push      # Push schema changes (use after schema modifications)
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio
```

**Infrastructure Setup:**
```bash
./start-database.sh  # Start PostgreSQL in Docker
./start-redis.sh     # Start Redis in Docker
```

**Testing & Evaluation:**
```bash
pnpm evals        # Run evaluations with Evalite
```

## Architecture Overview

**DeepSearch** is a production-grade AI research assistant built with Next.js 15 that combines conversational AI with real-time web research capabilities. The app uses Google Gemini 2.0 Flash with tool-calling to perform intelligent web searches via Tavily API and web scraping.

### Core Components

**AI Pipeline:**
- `src/deep-search/index.ts` - Main AI orchestration with tool-calling workflow
- `src/app/api/chat/route.ts` - Streaming chat API with rate limiting and observability
- `src/models.ts` - AI model configuration (Google Gemini)

**Research Tools:**
- `src/tavily.ts` - Tavily API integration for web search with Redis caching
- `src/scraper.ts` - Web scraping with content extraction using Cheerio

**Data Layer:**
- `src/server/db/schema.ts` - Drizzle ORM schema (users, chats, messages, rate limiting)
- `src/server/db/queries.ts` - Database query helpers
- PostgreSQL for persistence, Redis for caching

**Authentication & Security:**
- `src/server/auth/` - NextAuth.js with Discord OAuth
- `src/rate-limit.ts` - Global and per-user rate limiting with Redis
- Admin users bypass rate limits (configured in `src/env.js`)

**Observability:**
- Langfuse integration for AI workflow tracing
- OpenTelemetry for performance monitoring
- `src/instrumentation.ts` - Telemetry setup

### Key Features

1. **Smart Search Strategy:** Automatically applies time ranges for recent queries, performs multi-angle searches, and scrapes full content from authoritative sources
2. **Streaming UI:** Real-time response streaming with tool invocation visualization
3. **Rate Limiting:** Global LLM rate limits + per-user daily limits (admins exempt)
4. **Chat Persistence:** Full conversation history with message threading
5. **Enterprise Monitoring:** Comprehensive observability with Langfuse traces

## Code Conventions

**File Naming:**
- Use dash-case for components: `auth-button.tsx`, `chat-message.tsx`
- TypeScript over JavaScript everywhere

**Import Style:**
```typescript
import type { Message } from "ai"; // Preferred: type on entire import
```

**Styling:**
- Use `size-4` instead of `h-4 w-4`
- Lucide React for icons
- Tailwind CSS with custom config

**Database:**
- Always run `pnpm db:push` after schema changes
- Use Drizzle queries in `src/server/db/queries.ts`

## Environment Configuration

Required environment variables are validated in `src/env.js`:
- Database: `DATABASE_URL`, `REDIS_URL`
- AI Services: `GOOGLE_GENERATIVE_AI_API_KEY`, `TAVILY_API_KEY`
- Auth: `AUTH_SECRET`, `AUTH_DISCORD_ID`, `AUTH_DISCORD_SECRET`
- Observability: `LANGFUSE_SECRET_KEY`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_BASEURL`

Admin users are configured via `ADMIN_USER_IDS` environment variable (comma-separated Discord user IDs).

## Development Notes

- Use `pnpm` as package manager
- The app uses Vercel AI SDK (`ai` + `@ai-sdk/react`) for streaming AI interactions
- Redis caching is implemented for Tavily searches with smart cache invalidation
- Rate limiting uses sliding window counters stored in Redis
- All AI interactions are traced in Langfuse for debugging and monitoring
- Tool-calling workflow supports up to 10 steps with search and scraping tools