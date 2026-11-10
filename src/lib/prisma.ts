import { PrismaClient } from "@prisma/client";

export type ExtendedPrismaClient = PrismaClient & {
  meeting: any;
  meetingAssignmentHistory: any;
  [key: string]: any;
};

const globalForPrisma = globalThis as unknown as { prisma: ExtendedPrismaClient | undefined };

/**
 * Optimizes the PostgreSQL database connection string specifically for Supabase serverless environments.
 * Supabase provides two pooler ports:
 * - Port 5432: Session Mode (capped at a strict 15 connections total -> triggers EMAXCONNSESSION crashes)
 * - Port 6543: Transaction Mode (supports thousands of concurrent serverless requests via PgBouncer)
 * 
 * This function automatically rewrites port 5432 to port 6543 and appends necessary PgBouncer flags.
 */
function getOptimizedDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // Automatically upgrade Supabase pooler from session mode (5432) to transaction mode (6543)
  if (url.includes(".pooler.supabase.com:5432")) {
    url = url.replace(".pooler.supabase.com:5432", ".pooler.supabase.com:6543");
  }

  // Ensure essential query parameters for PgBouncer & Serverless/Local dev resilience
  if (url.includes(".pooler.supabase.com")) {
    const [base, query = ""] = url.split("?");
    const params = new URLSearchParams(query);
    if (!params.has("sslmode")) {
      params.set("sslmode", "require");
    }
    if (!params.has("pgbouncer")) {
      params.set("pgbouncer", "true");
    }
    // Allow up to 10 connections to prevent queuing bottlenecks in dev and concurrent serverless routes
    if (!params.has("connection_limit") || params.get("connection_limit") === "1") {
      params.set("connection_limit", "10");
    }
    // Increase connect_timeout from default 5s to 30s so network latency/TLS negotiation never aborts prematurely
    if (!params.has("connect_timeout")) {
      params.set("connect_timeout", "30");
    }
    // Set pool_timeout to 30s to allow graceful waiting during brief network bursts
    if (!params.has("pool_timeout")) {
      params.set("pool_timeout", "30");
    }
    url = `${base}?${params.toString()}`;
  }

  // Ensure process.env.DATABASE_URL reflects the optimized string in-memory
  process.env.DATABASE_URL = url;
  return url;
}

function getPrismaClient(): ExtendedPrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const dbUrl = getOptimizedDatabaseUrl();

  const client = new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  }) as ExtendedPrismaClient;

  // In serverless environments (Vercel, AWS Lambda), persist the client on globalThis
  // so warm container invocations reuse existing connections and do not exhaust pool limits.
  globalForPrisma.prisma = client;
  return client;
}

export const prisma: ExtendedPrismaClient = getPrismaClient();

export * from "@prisma/client";
