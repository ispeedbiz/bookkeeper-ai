"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSent(true);
      }
    } catch {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy-950">
      <div className="absolute inset-0 gradient-mesh" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center">
          <Link href="/" className="inline-block text-2xl font-bold text-gradient">
            BookkeeperAI
          </Link>
          <p className="mt-2 text-slate-400">Reset your password</p>
        </div>

        <div className="mt-8 glass-card rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10">
                <CheckCircle className="h-6 w-6 text-teal-400" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-white">Check your email</h2>
              <p className="mt-2 text-sm text-slate-400">
                We sent a password reset link to <span className="text-white">{email}</span>.
                Please check your inbox and follow the instructions.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 rounded-lg bg-coral-500/10 border border-coral-500/20 px-4 py-3 text-sm text-coral-400">
                  {error}
                </div>
              )}

              <p className="mb-6 text-sm text-slate-400">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-navy-600 bg-navy-800/50 py-3 pl-11 pr-4 text-white placeholder-slate-500 outline-none transition-colors focus:border-teal-400/50"
                      placeholder="you@company.com"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 py-3.5 font-semibold text-navy-950 transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          <Link href="/login" className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300">
            <ArrowLeft className="h-3 w-3" />
            Back to Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}
