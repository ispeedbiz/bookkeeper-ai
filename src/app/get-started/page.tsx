"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Eye, EyeOff, Check, Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { score: 1, label: "Weak", color: "bg-coral-400" };
  if (score <= 4) return { score: 2, label: "Fair", color: "bg-gold-400" };
  return { score: 3, label: "Strong", color: "bg-teal-400" };
}

export default function GetStartedPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const pwStrength = useMemo(() => getPasswordStrength(password), [password]);

  const validate = (): string | null => {
    if (!fullName.trim()) return "Full name is required";
    if (!email.trim()) return "Email is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter";
    if (!/[0-9]/.test(password)) return "Password must include a number";
    if (password !== confirmPassword) return "Passwords do not match";
    if (!agreedToTerms) return "You must agree to the Terms of Service and Privacy Policy";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      // Register via API
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, companyName, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      // Check if email verification is required
      if (data.requiresVerification) {
        setSuccess(true);
        // Don't try to sign in - wait for verification
        setLoading(false);
        return;
      }

      setSuccess(true);

      // Sign in via Supabase client
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Account created but can't sign in - likely needs email verification
        setError("");
        setSuccess(true);
        setLoading(false);
        return;
      }

      // Track login
      fetch("/api/auth/track-login", { method: "POST" }).catch(() => {});

      // Redirect to dashboard
      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy-950">
      <div className="absolute inset-0 gradient-mesh" />

      <div className="relative z-10 w-full max-w-md px-6 py-12">
        <div className="text-center">
          <Link
            href="/"
            className="inline-block text-2xl font-bold text-gradient"
          >
            BookkeeperAI
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-white">
            Start Your Free 14-Day Trial
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            No credit card required &bull; 1 entity included &bull; Cancel
            anytime
          </p>
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

          {success && (
            <div className="mb-4 rounded-lg bg-teal-500/10 border border-teal-500/20 px-4 py-4 text-center">
              <Check className="mx-auto h-8 w-8 text-teal-400" />
              <h3 className="mt-2 font-semibold text-teal-300">Account Created!</h3>
              <p className="mt-1 text-sm text-teal-400/80">
                Check your email for a verification link. Once verified, you can sign in.
              </p>
              <Link
                href="/login"
                className="mt-3 inline-block rounded-lg bg-teal-500 px-5 py-2 text-sm font-semibold text-navy-950 hover:bg-teal-400"
              >
                Go to Login
              </Link>
            </div>
          )}

          {!success && (
            <>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-navy-600 bg-navy-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-teal-400/50"
                    placeholder="John Smith"
                    disabled={loading}
                  />
                </div>

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
                    Company Name{" "}
                    <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-xl border border-navy-600 bg-navy-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-teal-400/50"
                    placeholder="Acme Inc."
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
                      placeholder="Min. 8 characters"
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
                  {/* Password Strength Meter */}
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              i <= pwStrength.score ? pwStrength.color : "bg-navy-700"
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`mt-1 text-xs ${
                        pwStrength.score === 1 ? "text-coral-400" :
                        pwStrength.score === 2 ? "text-gold-400" : "text-teal-400"
                      }`}>
                        {pwStrength.label} &mdash; Use 8+ chars, uppercase, numbers, and symbols
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-navy-600 bg-navy-800/50 px-4 py-3 pr-12 text-white placeholder-slate-500 outline-none transition-colors focus:border-teal-400/50"
                      placeholder="Repeat password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showConfirmPass ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-xs text-coral-400">Passwords do not match</p>
                  )}
                </div>
              </div>

              {/* Terms of Service */}
              <label className="mt-5 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-navy-600 bg-navy-800 text-teal-400 focus:ring-teal-400/20"
                  disabled={loading}
                />
                <span className="text-xs text-slate-400 leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-teal-400 hover:text-teal-300 underline" target="_blank">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-teal-400 hover:text-teal-300 underline" target="_blank">
                    Privacy Policy
                  </Link>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || !agreedToTerms}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 py-3.5 font-semibold text-navy-950 transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create Account
                  </>
                )}
              </button>
            </>
          )}
        </form>

        {/* Security badge */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5" />
          256-bit SSL encryption &bull; SOC 2 compliant
        </div>

        <p className="mt-4 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-teal-400 hover:text-teal-300">
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}
