import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { isUserAdmin } from "~/server/db/queries";
import { env } from "~/env";

export async function GET() {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userIsAdmin = await isUserAdmin(session.user.id);
  
  if (!userIsAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    services: {
      database: {
        url: env.DATABASE_URL ? "Configured" : "Missing",
      },
      redis: {
        url: env.REDIS_URL ? "Configured" : "Missing",
      },
      tavily: {
        apiKey: env.TAVILY_API_KEY ? "Configured" : "Missing",
      },
      googleAI: {
        apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY ? "Configured" : "Missing",
      },
      langfuse: {
        secretKey: env.LANGFUSE_SECRET_KEY ? "Configured" : "Missing",
        publicKey: env.LANGFUSE_PUBLIC_KEY ? "Configured" : "Missing",
        baseUrl: env.LANGFUSE_BASEURL ? "Configured" : "Missing",
      },
    },
    langfuse: {
      baseUrl: env.LANGFUSE_BASEURL,
      instructions: "Visit the Langfuse dashboard to see traces",
    },
  };

  return NextResponse.json(debugInfo);
} 