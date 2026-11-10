"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIdentifier = username.trim();
    const cleanPassword = password.trim();

    if (!cleanIdentifier || !cleanPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      let res: any;

      if (cleanIdentifier.includes("@")) {
        // Sign in using email
        res = await authClient.signIn.email({
          email: cleanIdentifier.toLowerCase(),
          password: cleanPassword,
        });
      } else {
        // Sign in using username (normalized lowercase first)
        res = await authClient.signIn.username({
          username: cleanIdentifier.toLowerCase(),
          password: cleanPassword,
        });

        // If lowercase failed and original was mixed-case, retry with exact input
        if (res.error && cleanIdentifier !== cleanIdentifier.toLowerCase()) {
          res = await authClient.signIn.username({
            username: cleanIdentifier,
            password: cleanPassword,
          });
        }
      }

      if (res.error) {
        toast.error(res.error.message || "Invalid credentials. Please verify username and password.");
      } else {
        toast.success("Successfully logged in!");
        
        const { data: session } = await authClient.getSession();
        if (session?.user) {
          const role = session.user.role;
          if (role === "ADMIN") {
            router.push("/admin/dashboard");
          } else if (role === "STATE_LEADER") {
            router.push("/state-leader/dashboard");
          } else if (role === "ZONE_LEADER") {
            router.push("/zone-leader/dashboard");
          } else if (role === "COORDINATOR" || role === "LEADER") {
            router.push("/coordinator/dashboard");
          } else {
            router.push("/coordinator/dashboard");
          }
        } else {
          router.push("/coordinator/dashboard");
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (uname: string, pass: string) => {
    setUsername(uname);
    setPassword(pass);
    toast.info(`Filled credentials for ${uname}`);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 font-sans bg-background text-foreground overflow-hidden">
      {/* Subtle decorative background pattern */}
      <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none" />

      {/* Login Card Container */}
      <div className="relative w-full max-w-100 space-y-5 animate-slideUp z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-full max-w-72 sm:max-w-80 rounded-2xl p-2 border border-border bg-card shadow-lg overflow-hidden">
            <img 
              src="/wcm-brand-banner.jpg" 
              alt="WCM Ministry Outreach" 
              className="w-full h-auto object-contain rounded-xl" 
            />
          </div>
          <h2 className="mt-4 text-xl sm:text-2xl font-black tracking-tight text-foreground uppercase">
            WCM Ministry
          </h2>
          <p className="mt-1 text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Reporting & Outreach Platform
          </p>
        </div>

        {/* Credentials Form Card */}
        <div className="rounded-2xl p-6 sm:p-7 border border-border bg-card shadow-xl">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-3.5">
              <div>
                <label 
                  htmlFor="username" 
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                >
                  Username or Email
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                  placeholder="Enter username (e.g. admin)"
                />
              </div>

              <div>
                <label 
                  htmlFor="password" 
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-input pl-3.5 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex min-h-11 items-center w-full justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider shadow-sm transition-all duration-150 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Quick Demo Accounts */}
        <div className="rounded-2xl p-4 sm:p-5 border border-border bg-card/60 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Quick Demo Accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Admin", uname: "admin" },
              { label: "Coordinator", uname: "coordinator" },
              { label: "State Leader", uname: "stateleader" },
              { label: "Zonal Leader", uname: "zoneleader" },
            ].map((acct) => (
              <button
                key={acct.uname}
                type="button"
                onClick={() => fillCredentials(acct.uname, "Password@123")}
                className="flex flex-col p-2.5 rounded-xl border border-border bg-card hover:bg-accent hover:border-border-elevated transition-all text-left cursor-pointer active:scale-98"
              >
                <span className="font-semibold text-foreground text-xs">
                  {acct.label}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">{acct.uname}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
