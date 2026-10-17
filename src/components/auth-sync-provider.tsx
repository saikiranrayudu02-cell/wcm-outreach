"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useUIStore } from "@/store/ui-store";

export function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const setUser = useUIStore((state) => state.setUser);

  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
    } else if (!isPending) {
      setUser(null);
    }
  }, [session, isPending, setUser]);

  return <>{children}</>;
}
