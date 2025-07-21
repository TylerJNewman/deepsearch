# DeepSearch

A production-grade AI-powered research assistant that combines conversational AI with real-time web research capabilities. DeepSearch enables users to ask questions and receive comprehensive, well-sourced answers backed by current information from across the web.

## Features

### 🔍 Advanced Research Capabilities
- **Real-time web search** powered by Tavily API
- **Intelligent web scraping** with content extraction and analysis
- **Time-filtered searches** for recent information (day/week/month)
- **Comprehensive source citation** with direct links
- **Multi-source synthesis** for thorough research

### 💬 Conversational AI Interface
- **Streaming responses** with real-time updates
- **Persistent chat history** across sessions
- **Rich markdown rendering** with syntax highlighting
- **Tool invocation visualization** showing research progress
- **Error handling** with user-friendly feedback

### 👥 User Management
- **Discord OAuth authentication** via NextAuth.js
- **Session persistence** with secure user data handling
- **Admin privileges** with configurable access levels
- **Rate limiting system** for API usage control

### 📊 Enterprise Features
- **Comprehensive observability** with Langfuse integration
- **OpenTelemetry monitoring** for performance tracking
- **Request analytics** and usage insights
- **Redis caching** for optimized performance
- **Scalable database architecture** with PostgreSQL

## Technology Stack

- **Frontend:** Next.js 15, React 18, TypeScript, Tailwind CSS
- **AI:** Google Gemini 2.0 Flash, AI SDK, Tool-calling architecture
- **Search & Research:** Tavily API, Cheerio web scraping
- **Database:** PostgreSQL with Drizzle ORM, Redis caching
- **Authentication:** NextAuth.js with Discord OAuth
- **Observability:** Langfuse, OpenTelemetry
- **Deployment:** Vercel-ready with Docker support

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Docker Desktop
- Discord OAuth application
- API keys for Gemini, Tavily, and Langfuse

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd deepsearch
   pnpm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Configure your API keys and database URLs
   ```

3. **Start infrastructure services**
   ```bash
   ./start-database.sh  # PostgreSQL
   ./start-redis.sh     # Redis cache
   ```

4. **Initialize database**
   ```bash
   pnpm db:push
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

Visit `http://localhost:3000` to access the application.

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."
REDIS_URL="redis://localhost:6379"

# AI Services
GOOGLE_GENERATIVE_AI_API_KEY="your_gemini_api_key"
TAVILY_API_KEY="your_tavily_api_key"

# Authentication
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"
DISCORD_CLIENT_ID="your_discord_client_id"
DISCORD_CLIENT_SECRET="your_discord_client_secret"

# Observability
LANGFUSE_SECRET_KEY="your_langfuse_secret"
LANGFUSE_PUBLIC_KEY="your_langfuse_public_key"
LANGFUSE_HOST="https://cloud.langfuse.com"
```

### Admin Users

Configure admin users in `src/env.js` to bypass rate limiting:
```typescript
ADMIN_USER_IDS: z.string().optional().default(""),
```

## Development Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm typecheck    # Run type checking
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix linting issues
pnpm format:write # Format code with Prettier
pnpm db:studio    # Open database studio
```

## Database Management

```bash
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema changes
pnpm db:studio    # Open Drizzle Studio
```

## Architecture

DeepSearch uses a modern, scalable architecture:

- **Frontend:** Server-side rendered Next.js with streaming UI
- **AI Pipeline:** Tool-calling workflow with Gemini 2.0 Flash
- **Data Layer:** PostgreSQL for persistence, Redis for caching
- **Search Engine:** Tavily API with intelligent result processing
- **Monitoring:** Comprehensive observability with Langfuse and OpenTelemetry

## Deployment

The application is optimized for Vercel deployment with:
- Automatic builds and deployments
- Environment variable management
- Database connection pooling
- Redis integration
- OpenTelemetry monitoring

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.