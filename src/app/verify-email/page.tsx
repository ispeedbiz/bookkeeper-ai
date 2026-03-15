"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, CheckCircle, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState(emailParam);
  const [loading, setLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState(
    errorParam === "verification_failed"
      ? "Email verification failed. Please try resending the verification email."
      : ""
  );

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  const handleResend = async () => {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");
    setResendSuccess(false);

    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (resendError) {
        setError(resendError.message);
      } else {
        setResendSuccess(true);
      }
    } catch {
      setError("Failed to resend verification email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy-950">
      <div className="absolute inset-0 gradient-mesh" />

      <div className="relative z-10 w-full max-w-md px-4 sm:px-6">
        <div className="text-center">
          <Link
            href="/"
            className="inline-block text-2xl font-bold text-gradient"
          >
            BookkeeperAI
          </Link>
        </div>

        <div className="mt-8 glass-card rounded-2xl p-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/10">
              <Mail className="h-7 w-7 text-teal-400" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-white">
              Check your email
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              We&apos;ve sent a verification link to{" "}
              {email ? (
                <span className="font-medium text-slate-300">{email}</span>
              ) : (
                "your email address"
              )}
              . Click the link to verify your account and get started.
            </p>
          </div>

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-lg bg-coral-500/10 border border-coral-500/20 px-4 py-3 text-sm text-coral-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resendSuccess && (
            <div className="mt-6 flex items-start gap-3 rounded-lg bg-teal-500/10 border border-teal-500/20 px-4 py-3 text-sm text-teal-400">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Verification email resent successfully. Please check your inbox
                and spam folder.
              </span>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {!emailParam && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-navy-600 bg-navy-800/50 py-3 pl-11 pr-4 text-white placeholder-slate-500 outline-none transition-colors focus:border-teal-400/50"
                    placeholder="you@example.com"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleResend}
              disabled={loading || !email}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 py-3.5 font-semibold text-navy-950 transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend verification email"
              )}
            </button>
          </div>

          <div className="mt-6 rounded-lg bg-navy-800/50 border border-navy-700/50 px-4 py-3">
            <p className="text-xs leading-relaxed text-slate-500">
              Didn&apos;t receive the email? Check your spam folder, or try
              resending. The verification link expires after 24 hours.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-navy-950">
          <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
