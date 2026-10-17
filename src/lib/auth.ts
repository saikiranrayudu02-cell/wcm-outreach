import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

const defaultBaseURL =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const auth = betterAuth({
  baseURL: defaultBaseURL,
  secret: process.env.BETTER_AUTH_SECRET || "vmlrs_super_secure_session_secret_2026_key_abc123",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: async (request?: Request) => {
    const list = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      defaultBaseURL,
      process.env.BETTER_AUTH_URL || "",
      process.env.NEXT_PUBLIC_APP_URL || "",
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
      process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "",
    ].filter(Boolean);

    try {
      const origin = request?.headers?.get("origin");
      if (origin && !list.includes(origin)) list.push(origin);
      const host = request?.headers?.get("host");
      if (host) {
        list.push(`https://${host}`);
        list.push(`http://${host}`);
      }
    } catch {}

    return list;
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
