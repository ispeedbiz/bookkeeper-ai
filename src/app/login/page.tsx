"use client";

import { useState } from "react";
import Link from "next/link";
import { LogIn, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();

      if (res.ok && data.redirectTo) {
        window.location.href = data.redirectTo;
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
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
          <p className="mt-2 text-slate-400">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 glass-card rounded-2xl p-8">
          {error && (
            <div className="mb-4 rounded-lg bg-coral-500/10 border border-coral-500/20 px-4 py-3 text-sm text-coral-400">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              I am a...
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "client", label: "Client" },
                { value: "cpa", label: "CPA Firm" },
                { value: "admin", label: "Admin" },
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`rounded-lg py-2 text-sm font-medium transition-all ${
                    role === r.value
                      ? "bg-teal-500 text-navy-950"
                      : "border border-navy-600 text-slate-400 hover:border-teal-400/30"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

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
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
            <a href="#" className="text-teal-400 hover:text-teal-300">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 py-3.5 font-semibold text-navy-950 transition-all hover:brightness-110"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </button>

          <div className="mt-6 rounded-lg bg-navy-800/50 p-4 text-center text-xs text-slate-500">
            <p className="font-medium text-slate-400">Demo Credentials</p>
            <p className="mt-1">client@demo.com | cpa@demo.com | admin@demo.com</p>
            <p>Password: demo123</p>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/contact" className="text-teal-400 hover:text-teal-300">
            Start Free Trial
          </Link>
        </p>
      </div>
    </main>
  );
}
