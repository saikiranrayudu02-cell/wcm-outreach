import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export type ExtendedPrismaClient = PrismaClient & {
  meeting: any;
  meetingAssignmentHistory: any;
  [key: string]: any;
};

export const prisma: ExtendedPrismaClient = (globalForPrisma.prisma || new PrismaClient()) as ExtendedPrismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "@prisma/client";
