"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Send, Clock, Loader2 } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { COMPANY } from "@/lib/constants";

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    type: "business",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formState.name,
          email: formState.email,
          company: formState.company,
          message: formState.message,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-navy-950">
      <Navbar />

      <section className="relative pt-32 pb-20">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold sm:text-5xl">
              Let&apos;s <span className="text-gradient">Talk</span>
            </h1>
            <p className="mt-4 text-lg text-slate-400">
              Book a discovery call and let us show you where your business is leaking
              time, money, and opportunities.
            </p>
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-5">
            {/* Form */}
            <div className="lg:col-span-3">
              {submitted ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/20">
                    <Send className="h-8 w-8 text-teal-400" />
                  </div>
                  <h3 className="mt-6 text-2xl font-bold text-white">
                    Message Sent!
                  </h3>
                  <p className="mt-3 text-slate-400">
                    Thank you! We&apos;ll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8">
                  {error && (
                    <div className="mb-6 rounded-xl border border-coral-400/30 bg-coral-400/10 px-4 py-3 text-sm text-coral-400">
                      {error}
                    </div>
                  )}

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formState.name}
                        onChange={(e) =>
                          setFormState({ ...formState, name: e.target.value })
                        }
                        className="w-full rounded-xl border border-navy-600 bg-navy-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-teal-400/50"
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formState.email}
                        onChange={(e) =>
                          setFormState({ ...formState, email: e.target.value })
                        }
                        className="w-full rounded-xl border border-navy-600 bg-navy-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-teal-400/50"
                        placeholder="john@company.com"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Company
                      </label>
                      <input
                        type="text"
                        value={formState.company}
                        onChange={(e) =>
                          setFormState({ ...formState, company: e.target.value })
                        }
                        className="w-full rounded-xl border border-navy-600 bg-navy-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-teal-400/50"
                        placeholder="Company Inc."
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formState.phone}
                        onChange={(e) =>
                          setFormState({ ...formState, phone: e.target.value })
                        }
                        className="w-full rounded-xl border border-navy-600 bg-navy-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-teal-400/50"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      I am a...
                    </label>
                    <div className="flex gap-3">
                      {["CPA Firm", "Business Owner", "Other"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() =>
                            setFormState({
                              ...formState,
                              type: type.toLowerCase().replace(" ", "-"),
                            })
                          }
                          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                            formState.type ===
                            type.toLowerCase().replace(" ", "-")
                              ? "bg-teal-500 text-navy-950"
                              : "border border-navy-600 text-slate-400 hover:border-teal-400/30"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formState.message}
                      onChange={(e) =>
                        setFormState({ ...formState, message: e.target.value })
                      }
                      className="w-full rounded-xl border border-navy-600 bg-navy-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-teal-400/50"
                      placeholder="Tell us about your bookkeeping needs..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 py-3.5 font-semibold text-navy-950 transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-6 lg:col-span-2">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white">Contact Info</h3>
                <div className="mt-6 space-y-5">
                  <div className="flex items-start gap-4">
                    <Phone className="mt-1 h-5 w-5 text-teal-400" />
                    <div>
                      <p className="text-sm text-slate-400">Phone</p>
                      <p className="text-white">{COMPANY.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Mail className="mt-1 h-5 w-5 text-teal-400" />
                    <div>
                      <p className="text-sm text-slate-400">Email</p>
                      <p className="text-white">{COMPANY.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <MapPin className="mt-1 h-5 w-5 text-teal-400" />
                    <div>
                      <p className="text-sm text-slate-400">Office</p>
                      <p className="text-white">{COMPANY.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Clock className="mt-1 h-5 w-5 text-teal-400" />
                    <div>
                      <p className="text-sm text-slate-400">Hours</p>
                      <p className="text-white">24/7 Platform Access</p>
                      <p className="text-sm text-slate-400">
                        Support: Mon-Fri, 9AM-6PM EST
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white">
                  Book a Discovery Call
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  Schedule a free 30-minute consultation to see how BookkeeperAI can
                  transform your bookkeeping operations.
                </p>
                <a
                  href="#"
                  className="mt-4 block rounded-xl border border-gold-400/30 py-3 text-center text-sm font-semibold text-gold-400 transition-all hover:bg-gold-400/10"
                >
                  Schedule Call
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
