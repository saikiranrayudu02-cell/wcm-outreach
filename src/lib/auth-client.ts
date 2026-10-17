import { createAuthClient } from "better-auth/react";
import { usernameClient, inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"),
  plugins: [
    usernameClient(),
    inferAdditionalFields({
      user: {
        role: { type: "string" },
        state: { type: "string" },
        part: { type: "string" },
        zone: { type: "string" },
      }
    })
  ],
});
export type AuthClient = typeof authClient;
