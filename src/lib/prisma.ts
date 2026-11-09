import { PrismaClient } from "@prisma/client";

export type ExtendedPrismaClient = PrismaClient & {
  meeting: any;
  meetingAssignmentHistory: any;
  [key: string]: any;
};

const globalForPrisma = globalThis as unknown as { prisma: ExtendedPrismaClient | undefined };

function getPrismaClient(): ExtendedPrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  }) as ExtendedPrismaClient;

  // In serverless environments (Vercel, AWS Lambda), persist the client on globalThis
  // so warm container invocations reuse existing connections and do not exhaust pool limits.
  globalForPrisma.prisma = client;
  return client;
}

export const prisma: ExtendedPrismaClient = getPrismaClient();

export * from "@prisma/client";
