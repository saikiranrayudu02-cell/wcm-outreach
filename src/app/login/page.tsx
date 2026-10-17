"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { ShieldAlert, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await authClient.signIn.username({
        username,
        password,
      });

      if (error) {
        toast.error(error.message || "Invalid credentials. Please try again.");
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
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#090d16] px-3 sm:px-4 font-sans animate-fadeIn">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03),0_12px_24px_-4px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-800/80 animate-slideUp">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 shadow-lg mb-2">
            <img src="/wcm-logo.png" alt="WCM Logo" className="h-16 w-auto object-contain" />
          </div>
          <h2 className="mt-4 text-xl font-black tracking-widest text-slate-900 dark:text-white uppercase">
            WCM Ministry
          </h2>
          <p className="mt-1.5 text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
            Reporting & Outreach Platform
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label 
                htmlFor="username" 
                className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-400 mb-2"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-base sm:text-sm min-h-11 text-slate-800 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all duration-200"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-400 mb-2"
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
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-4 pr-10 py-3 text-base sm:text-sm min-h-11 text-slate-800 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 cursor-pointer"
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
              className="flex min-h-11 items-center w-full justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white border border-blue-650/10 px-4 py-3 text-xs font-bold uppercase tracking-wider shadow-md active:scale-[0.98] transition-all duration-150 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
