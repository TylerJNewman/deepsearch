import type { Message } from "ai";

export const evaluationQuestions: { input: Message[]; expected: string }[] = [
  {
    input: [
      {
        id: "1",
        role: "user",
        content: "What is the latest version of TypeScript?",
      },
    ],
    expected: "The latest stable version of TypeScript is 5.8.3, and TypeScript 5.9 Beta is also available.",
  },
  {
    input: [
      {
        id: "2",
        role: "user",
        content: "What are the main features of Next.js 15?",
      },
    ],
    expected: `Next.js 15 is a stable release with React 19 integration, including experimental React Compiler support and improved hydration error handling. Key features include: 
• Overhauled caching system (breaking change) - caching is now opt-in for fetch requests, GET Route Handlers, and client navigations
• Stable Turbopack development server with significantly faster startup times and code updates  
• Enhanced Form component with prefetching, client-side navigation, and progressive enhancement
• Server Actions Security improvements with unguessable endpoints
• Async Request APIs (breaking change) for future optimizations
• ESLint 9 support and stable instrumentation.js API
• Experimental unstable_after API for post-response code execution
• TypeScript support for next.config.js and @next/codemod CLI for automated upgrades`,
  },
]; 