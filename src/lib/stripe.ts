/**
 * Stripe configuration and utilities for BookkeeperAI billing.
 * Uses Stripe for subscription management, invoicing, and payment processing.
 *
 * Environment variables required:
 * - STRIPE_SECRET_KEY: Stripe secret API key
 * - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: Stripe publishable key
 * - STRIPE_WEBHOOK_SECRET: Stripe webhook signing secret
 */

export const STRIPE_PLANS = {
  cpa: {
    starter: {
      name: "CPA Starter",
      priceId: process.env.STRIPE_CPA_STARTER_PRICE_ID || "",
      amount: 24900, // CAD $249.00
      currency: "cad",
      interval: "month" as const,
      entityLimit: 10,
    },
    growth: {
      name: "CPA Growth",
      priceId: process.env.STRIPE_CPA_GROWTH_PRICE_ID || "",
      amount: 17900, // CAD $179.00 per entity
      currency: "cad",
      interval: "month" as const,
      entityLimit: 50,
      perEntity: true,
    },
    enterprise: {
      name: "CPA Enterprise",
      priceId: process.env.STRIPE_CPA_ENTERPRISE_PRICE_ID || "",
      amount: 11900, // CAD $119.00 per entity
      currency: "cad",
      interval: "month" as const,
      entityLimit: Infinity,
      perEntity: true,
    },
  },
  direct: {
    essential: {
      name: "Essential",
      priceId: process.env.STRIPE_DIRECT_ESSENTIAL_PRICE_ID || "",
      amount: 44900,
      currency: "cad",
      interval: "month" as const,
    },
    professional: {
      name: "Professional",
      priceId: process.env.STRIPE_DIRECT_PROFESSIONAL_PRICE_ID || "",
      amount: 69900,
      currency: "cad",
      interval: "month" as const,
    },
    premium: {
      name: "Premium",
      priceId: process.env.STRIPE_DIRECT_PREMIUM_PRICE_ID || "",
      amount: 99900,
      currency: "cad",
      interval: "month" as const,
    },
  },
  addons: {
    payroll: {
      name: "Payroll Processing",
      priceId: process.env.STRIPE_PAYROLL_PRICE_ID || "",
      amount: 9900,
      currency: "cad",
      interval: "month" as const,
    },
    taxFiling: {
      name: "Tax Filing Support",
      priceId: process.env.STRIPE_TAX_FILING_PRICE_ID || "",
      amount: 19900,
      currency: "cad",
    },
    aiAnalysis: {
      name: "AI Financial Analysis",
      priceId: process.env.STRIPE_AI_ANALYSIS_PRICE_ID || "",
      amount: 14900,
      currency: "cad",
      interval: "month" as const,
    },
  },
} as const;

export function formatCurrency(amount: number, currency = "cad"): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100);
}
