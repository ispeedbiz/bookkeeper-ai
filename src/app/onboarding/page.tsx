"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  Loader2,
  Sparkles,
  Users,
  FileText,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CPA_PRICING, DIRECT_PRICING } from "@/lib/constants";

const INDUSTRIES = [
  "Accounting / CPA Firm",
  "Construction",
  "E-Commerce / Retail",
  "Food & Beverage",
  "Healthcare",
  "Legal Services",
  "Manufacturing",
  "Professional Services",
  "Real Estate",
  "Technology",
  "Transportation & Logistics",
  "Other",
] as const;

const STEPS = [
  { label: "Company Info", icon: Building2 },
  { label: "Select Plan", icon: Sparkles },
  { label: "First Entity", icon: Users },
  { label: "Upload Document", icon: FileText },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Company Info
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [businessType, setBusinessType] = useState("");

  // Step 2: Plan selection
  const [pricingTab, setPricingTab] = useState<"cpa" | "direct">("direct");
  const [selectedPlan, setSelectedPlan] = useState("");

  // Step 3: Entity
  const [entityName, setEntityName] = useState("");
  const [entityType, setEntityType] = useState("");
  const [fiscalYearEnd, setFiscalYearEnd] = useState("");

  // Step 4: Upload
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const progress = ((step + 1) / STEPS.length) * 100;

  const canProceed = (): boolean => {
    switch (step) {
      case 0:
        return !!companyName.trim() && !!industry && !!businessType;
      case 1:
        return !!selectedPlan;
      case 2:
        return !!entityName.trim() && !!entityType && !!fiscalYearEnd;
      case 3:
        return true; // Upload is optional
      default:
        return false;
    }
  };

  const handleNext = async () => {
    setError("");

    if (step === 0) {
      // Save company info to profile
      setLoading(true);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("Please log in to continue.");
          setLoading(false);
          return;
        }

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ company_name: companyName, industry })
          .eq("id", user.id);

        if (updateError) {
          setError(updateError.message);
          setLoading(false);
          return;
        }
      } catch {
        setError("Failed to save company info. Please try again.");
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    if (step === 2) {
      // Create entity
      setLoading(true);
      try {
        const res = await fetch("/api/entities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: entityName,
            type: entityType,
            fiscal_year_end: fiscalYearEnd,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to create entity.");
          setLoading(false);
          return;
        }
      } catch {
        setError("Failed to create entity. Please try again.");
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    // Optionally upload file here in the future
    router.push("/dashboard");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const plans = pricingTab === "cpa" ? CPA_PRICING : DIRECT_PRICING;

  return (
    <main className="min-h-screen bg-navy-950">
      <div className="absolute inset-0 gradient-mesh" />

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-block text-2xl font-bold text-gradient"
          >
            BookkeeperAI
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-white">
            Let&apos;s get you set up
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Step {step + 1} of {STEPS.length} &mdash; {STEPS[step].label}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <div key={s.label} className="flex flex-col items-center gap-1">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                      isDone
                        ? "border-teal-400 bg-teal-400/20 text-teal-400"
                        : isActive
                          ? "border-teal-400 bg-navy-800 text-teal-400"
                          : "border-navy-600 bg-navy-800 text-slate-500"
                    }`}
                  >
                    {isDone ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={`text-xs ${isActive || isDone ? "text-teal-400" : "text-slate-500"}`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="h-1.5 w-full rounded-full bg-navy-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="mt-8 glass-card rounded-2xl p-8">
          {error && (
            <div className="mb-6 rounded-lg bg-coral-500/10 border border-coral-500/20 px-4 py-3 text-sm text-coral-400">
              {error}
            </div>
          )}

          {/* Step 1: Company Info */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Welcome! Tell us about your company
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  This helps us tailor the experience for your business.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-navy-600 bg-navy-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-teal-400/50"
                  placeholder="Acme Inc."
                  disabled={loading}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-xl border border-navy-600 bg-navy-800/50 px-4 py-3 text-white outline-none transition-colors focus:border-teal-400/50 appearance-none"
                  disabled={loading}
                >
                  <option value="" className="bg-navy-800">
                    Select your industry
                  </option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind} className="bg-navy-800">
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Business Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "CPA / Accounting Firm",
                    "Direct Business",
                  ].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setBusinessType(type)}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                        businessType === type
                          ? "border-teal-400/50 bg-teal-400/10 text-teal-400"
                          : "border-navy-600 bg-navy-800 text-white hover:border-navy-500"
                      }`}
                      disabled={loading}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select Plan */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Choose your plan
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Select the pricing that fits your needs. You can change this
                  later.
                </p>
              </div>

              {/* Tab Toggle */}
              <div className="flex rounded-xl border border-navy-600 bg-navy-800 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setPricingTab("cpa");
                    setSelectedPlan("");
                  }}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                    pricingTab === "cpa"
                      ? "bg-gradient-to-r from-teal-500 to-teal-400 text-navy-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  CPA Partners
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPricingTab("direct");
                    setSelectedPlan("");
                  }}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                    pricingTab === "direct"
                      ? "bg-gradient-to-r from-teal-500 to-teal-400 text-navy-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Direct Business
                </button>
              </div>

              {/* Plans */}
              <div className="space-y-3">
                {plans.map((plan) => (
                  <button
                    key={plan.name}
                    type="button"
                    onClick={() => setSelectedPlan(plan.name)}
                    className={`w-full rounded-xl border p-5 text-left transition-all ${
                      selectedPlan === plan.name
                        ? "border-teal-400/50 bg-teal-400/5"
                        : "border-navy-600 bg-navy-800/50 hover:border-navy-500"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">
                            {plan.name}
                          </h3>
                          {plan.highlighted && (
                            <span className="rounded-full bg-teal-400/10 px-2 py-0.5 text-xs font-medium text-teal-400">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-slate-400">
                          {plan.entities}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gradient">
                          {plan.price}
                        </span>
                        <span className="text-xs text-slate-400">
                          {plan.period}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {plan.features.slice(0, 3).map((f) => (
                        <span
                          key={f}
                          className="inline-flex items-center gap-1 rounded-full bg-navy-700/50 px-2.5 py-1 text-xs text-slate-300"
                        >
                          <Check className="h-3 w-3 text-teal-400" />
                          {f}
                        </span>
                      ))}
                      {plan.features.length > 3 && (
                        <span className="inline-flex items-center rounded-full bg-navy-700/50 px-2.5 py-1 text-xs text-slate-400">
                          +{plan.features.length - 3} more
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Create First Entity */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Create your first entity
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  An entity represents a business whose books we&apos;ll manage.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Business Name
                </label>
                <input
                  type="text"
                  required
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  className="w-full rounded-xl border border-navy-600 bg-navy-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-teal-400/50"
                  placeholder="My Business LLC"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Entity Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "corporation", label: "Corporation" },
                    { value: "sole_prop", label: "Sole Proprietor" },
                    { value: "partnership", label: "Partnership" },
                  ].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setEntityType(t.value)}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                        entityType === t.value
                          ? "border-teal-400/50 bg-teal-400/10 text-teal-400"
                          : "border-navy-600 bg-navy-800 text-white hover:border-navy-500"
                      }`}
                      disabled={loading}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Fiscal Year End
                </label>
                <input
                  type="date"
                  value={fiscalYearEnd}
                  onChange={(e) => setFiscalYearEnd(e.target.value)}
                  className="w-full rounded-xl border border-navy-600 bg-navy-800/50 px-4 py-3 text-white outline-none transition-colors focus:border-teal-400/50"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Step 4: Upload Document */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Upload your first document
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Drop a bank statement, receipt, or invoice to get started.
                  This step is optional.
                </p>
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-all ${
                  dragOver
                    ? "border-teal-400 bg-teal-400/5"
                    : file
                      ? "border-teal-400/30 bg-teal-400/5"
                      : "border-navy-600 bg-navy-800/30 hover:border-navy-500"
                }`}
              >
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-400/10">
                      <FileText className="h-6 w-6 text-teal-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-white">{file.name}</p>
                      <p className="text-xs text-slate-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-coral-400"
                    >
                      <X className="h-3 w-3" />
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-700">
                      <Upload className="h-6 w-6 text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-white">
                        Drag & drop your file here
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        or click to browse
                      </p>
                    </div>
                    <label className="mt-2 cursor-pointer rounded-xl border border-navy-600 bg-navy-800 px-4 py-2 text-sm text-white hover:border-navy-500 transition-colors">
                      Browse Files
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.csv,.xlsx,.xls,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setFile(f);
                        }}
                      />
                    </label>
                    <p className="text-xs text-slate-500">
                      PDF, CSV, Excel, or images up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep(step - 1);
                }}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-navy-600 bg-navy-800 px-5 py-3 text-sm font-medium text-white transition-all hover:border-navy-500 disabled:opacity-60"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading || !canProceed()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 px-6 py-3 text-sm font-semibold text-navy-950 transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 px-6 py-3 text-sm font-semibold text-navy-950 transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Finishing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Go to Dashboard
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Skip link */}
        <p className="mt-6 text-center text-sm text-slate-400">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-teal-400 hover:text-teal-300"
          >
            Skip for now
          </button>
        </p>
      </div>
    </main>
  );
}
