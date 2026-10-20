import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

const defaultBaseURL =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const isProd = process.env.NODE_ENV === "production";
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const authSecret = process.env.BETTER_AUTH_SECRET;
if (isProd && !authSecret && !isBuildPhase) {
  throw new Error("FATAL: BETTER_AUTH_SECRET environment variable must be set in production.");
}

export const auth = betterAuth({
  baseURL: defaultBaseURL,
  secret: authSecret || "vmlrs_super_secure_session_secret_2026_key_abc123",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: async (request?: Request) => {
    const trustedList = new Set<string>([
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      defaultBaseURL,
      process.env.BETTER_AUTH_URL || "",
      process.env.NEXT_PUBLIC_APP_URL || "",
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
      process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "",
    ].filter(Boolean));

    // Allow legitimate preview deployments on vercel.app or local network dev
    try {
      const origin = request?.headers?.get("origin");
      if (origin) {
        const originUrl = new URL(origin);
        // Only allow if localhost, 127.0.0.1, or legitimate preview deployment for this specific project
        const isLocal = originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1";
        const isProjectVercel =
          originUrl.hostname.endsWith(".vercel.app") &&
          (originUrl.hostname.startsWith("wcm-outreach") ||
           originUrl.hostname.startsWith("wcm_outreach") ||
           (process.env.VERCEL_PROJECT_PRODUCTION_URL && originUrl.hostname.includes(process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(".vercel.app", ""))));

        if (isLocal || isProjectVercel) {
          trustedList.add(origin);
        }
      }
    } catch {}

    return Array.from(trustedList);
  },
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password: string) => {
        return await bcrypt.hash(password, 10);
      },
      verify: async ({ hash, password }) => {
        return await bcrypt.compare(password, hash);
      },
    },
  },
  plugins: [username()],
  user: {
    modelName: "User",
    additionalFields: {
      role: {
        type: "string",
      },
      state: {
        type: "string",
      },
      part: {
        type: "string",
      },
      zone: {
        type: "string",
      },
    }
  }
});
export type Auth = typeof auth;
