"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      // Fetch profile role to determine redirect
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Authentication failed. Please try again.");
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role || "client";

      if (role === "admin") {
        router.push("/admin");
      } else if (role === "cpa") {
        router.push("/cpa");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy-950">
      <div className="absolute inset-0 gradient-mesh" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center">
          <Link
            href="/"
            className="inline-block text-2xl font-bold text-gradient"
          >
            BookkeeperAI
          </Link>
          <p className="mt-2 text-slate-400">Sign in to your account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 glass-card rounded-2xl p-8"
        >
          {error && (
            <div className="mb-4 rounded-lg bg-coral-500/10 border border-coral-500/20 px-4 py-3 text-sm text-coral-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-navy-600 bg-navy-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-teal-400/50"
                placeholder="you@company.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-navy-600 bg-navy-800/50 px-4 py-3 pr-12 text-white placeholder-slate-500 outline-none transition-colors focus:border-teal-400/50"
                  placeholder="Enter password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-400">
              <input
                type="checkbox"
                className="rounded border-navy-600 bg-navy-800"
              />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-teal-400 hover:text-teal-300">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 py-3.5 font-semibold text-navy-950 transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Sign In
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/get-started"
            className="text-teal-400 hover:text-teal-300"
          >
            Start Free Trial
          </Link>
        </p>
      </div>
    </main>
  );
}
