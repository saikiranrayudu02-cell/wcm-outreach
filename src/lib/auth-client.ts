import { createAuthClient } from "better-auth/react";
import { usernameClient, inferAdditionalFields } from "better-auth/client/plugins";

const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
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
