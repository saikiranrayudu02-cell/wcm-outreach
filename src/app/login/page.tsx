"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Eye, EyeOff, KeyRound, UserCheck, ArrowRight, Sparkles } from "lucide-react";
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
    <div className="relative flex min-h-screen items-center justify-center px-4 sm:px-6 font-sans overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      
      {/* Decorative elements */}
      <div className="absolute inset-0 dot-pattern opacity-30" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-10" 
        style={{ background: "radial-gradient(circle, rgba(129,140,248,0.4) 0%, transparent 70%)", filter: "blur(60px)" }} 
      />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full opacity-10" 
        style={{ background: "radial-gradient(circle, rgba(167,139,250,0.4) 0%, transparent 70%)", filter: "blur(60px)" }} 
      />

      {/* Login Card */}
      <div className="relative w-full max-w-105 space-y-6 animate-slideUp z-10">
        {/* Logo section */}
        <div className="flex flex-col items-center text-center mb-2">
          <div className="relative animate-float">
            <div className="absolute -inset-3 rounded-3xl opacity-30" 
              style={{ background: "radial-gradient(circle, rgba(129,140,248,0.3) 0%, transparent 70%)", filter: "blur(16px)" }} 
            />
            <div className="relative rounded-3xl p-4 backdrop-blur-sm border border-white/10"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <img src="/wcm-logo.png" alt="WCM Logo" className="h-16 w-auto object-contain" style={{ filter: "drop-shadow(0 4px 12px rgba(129,140,248,0.3))" }} />
            </div>
          </div>
          <h2 className="mt-6 text-2xl font-black tracking-wider text-white uppercase">
            WCM Ministry
          </h2>
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-300/50">
            Reporting & Outreach Platform
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl p-5 sm:p-8 border border-white/10 backdrop-blur-xl"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label 
                  htmlFor="username" 
                  className="block text-[10px] font-bold uppercase tracking-widest text-indigo-200/50 mb-2"
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
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base sm:text-sm text-white placeholder-indigo-300/25 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-400/10 focus:outline-none transition-all duration-200 backdrop-blur-sm"
                  placeholder="Enter username (e.g. admin)"
                />
              </div>

              <div>
                <label 
                  htmlFor="password" 
                  className="block text-[10px] font-bold uppercase tracking-widest text-indigo-200/50 mb-2"
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
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-4 pr-10 py-3 text-base sm:text-sm text-white placeholder-indigo-300/25 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-400/10 focus:outline-none transition-all duration-200 backdrop-blur-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-indigo-300/30 hover:text-indigo-200 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex min-h-12 items-center w-full justify-center gap-2 rounded-xl text-white px-4 py-3.5 text-xs font-bold uppercase tracking-wider shadow-lg active:scale-[0.97] transition-all duration-200 disabled:opacity-50 cursor-pointer group"
                style={{ 
                  background: "var(--gradient-accent)",
                  boxShadow: "0 4px 20px rgba(99,102,241,0.35), 0 1px 3px rgba(0,0,0,0.1)" 
                }}
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Quick Demo Accounts */}
        <div className="rounded-3xl p-5 border border-white/8 backdrop-blur-xl"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300/30 mb-3 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-indigo-400/40" />
            Quick Demo Accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Admin", uname: "admin" },
              { label: "Coordinator", uname: "leader_john" },
              { label: "State Leader", uname: "state_ap" },
              { label: "Zone Leader", uname: "zone_1" },
            ].map((acct) => (
              <button
                key={acct.uname}
                type="button"
                onClick={() => fillCredentials(acct.uname, "Password@123")}
                className="flex flex-col p-3 rounded-xl border border-white/5 bg-white/3 hover:bg-white/8 hover:border-indigo-400/20 transition-all text-left cursor-pointer group"
              >
                <span className="font-bold text-white/80 group-hover:text-indigo-300 text-xs transition-colors">
                  {acct.label}
                </span>
                <span className="text-[10px] text-indigo-300/25 font-mono">{acct.uname}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
