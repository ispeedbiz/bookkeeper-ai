# BookkeeperAI Full-Stack Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform BookkeeperAI from frontend-only prototype into a fully functional SaaS with real auth, database, payments, document uploads, email notifications, and admin controls.

**Architecture:** Supabase provides auth + PostgreSQL + file storage + realtime in one service. Stripe handles subscriptions with webhooks syncing status to Supabase. Resend sends transactional emails using React Email templates. Tawk.to provides live chat. Next.js middleware enforces role-based access.

**Tech Stack:** Next.js 15, Supabase (auth/db/storage), Stripe, Resend, React Email, Tawk.to

**Design Doc:** `docs/plans/2026-03-14-full-stack-backend-design.md`

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install all required packages**

Run:
```bash
cd /Users/ai2all/Documents/Personal/Bookkeeper/bookkeeper-ai
npm install @supabase/supabase-js @supabase/ssr stripe resend @react-email/components react-email
```

**Step 2: Verify installation**

Run: `npm ls @supabase/supabase-js stripe resend`
Expected: All three packages listed without errors.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: Add Supabase, Stripe, Resend, React Email"
```

---

## Task 2: Environment Variables & Supabase Client

**Files:**
- Modify: `.env.example` — update with Supabase variables (remove Clerk/AWS/SendGrid, add Supabase + Resend)
- Create: `.env.local` — actual environment values
- Create: `src/lib/supabase/client.ts` — browser Supabase client
- Create: `src/lib/supabase/server.ts` — server-side Supabase client
- Create: `src/lib/supabase/middleware.ts` — middleware Supabase client
- Create: `src/lib/resend.ts` — Resend client

**Step 1: Update `.env.example`**

Replace all Clerk/AWS/SendGrid variables with:
```env
# ── App ──
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=BookkeeperAI

# ── Supabase ──
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ── Stripe Billing ──
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
STRIPE_CPA_STARTER_PRICE_ID=price_...
STRIPE_CPA_GROWTH_PRICE_ID=price_...
STRIPE_CPA_ENTERPRISE_PRICE_ID=price_...
STRIPE_DIRECT_ESSENTIAL_PRICE_ID=price_...
STRIPE_DIRECT_PROFESSIONAL_PRICE_ID=price_...
STRIPE_DIRECT_PREMIUM_PRICE_ID=price_...
STRIPE_PAYROLL_PRICE_ID=price_...
STRIPE_TAX_FILING_PRICE_ID=price_...
STRIPE_AI_ANALYSIS_PRICE_ID=price_...

# ── Email (Resend) ──
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=BookkeeperAI <noreply@bookkeeperai.com>

# ── Live Chat (Tawk.to) ──
NEXT_PUBLIC_TAWKTO_PROPERTY_ID=69b5f3f81689cc1c37408f2a
NEXT_PUBLIC_TAWKTO_WIDGET_ID=1jjnc208q

# ── Admin Seed ──
ADMIN_EMAIL=catchjagdish@gmail.com
ADMIN_PASSWORD=dilseI@1007
```

**Step 2: Create `.env.local`**

Copy `.env.example` to `.env.local` and fill with real Supabase project credentials from the Supabase dashboard. The user must create a Supabase project at https://supabase.com/dashboard and copy the URL + anon key + service role key.

**Step 3: Create `src/lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Step 4: Create `src/lib/supabase/server.ts`**

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}

export async function createServiceRoleClient() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

**Step 5: Create `src/lib/supabase/middleware.ts`**

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user, supabase };
}
```

**Step 6: Create `src/lib/resend.ts`**

```typescript
import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);
```

**Step 7: Commit**

```bash
git add src/lib/supabase/ src/lib/resend.ts .env.example
git commit -m "feat: Add Supabase client setup and Resend config"
```

---

## Task 3: Database Schema (Supabase SQL)

**Files:**
- Create: `supabase/schema.sql` — full database schema with RLS policies

**Step 1: Create `supabase/schema.sql`**

Write a single SQL file that creates all tables, enums, RLS policies, triggers, and seeds the admin user. This file will be run in the Supabase SQL Editor.

```sql
-- =============================================
-- BookkeeperAI Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enums
CREATE TYPE user_role AS ENUM ('client', 'cpa', 'admin', 'employee');
CREATE TYPE entity_type AS ENUM ('business', 'individual');
CREATE TYPE entity_status AS ENUM ('active', 'onboarding', 'paused');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'cancelled', 'incomplete');
CREATE TYPE plan_type AS ENUM ('starter', 'growth', 'enterprise', 'essential', 'professional', 'premium');
CREATE TYPE document_type AS ENUM ('invoice', 'receipt', 'bank_statement', 'tax_form', 'payroll', 'other');
CREATE TYPE document_status AS ENUM ('uploaded', 'processing', 'reviewed', 'approved', 'rejected');
CREATE TYPE activity_type AS ENUM ('account_created', 'login', 'document_uploaded', 'document_status_changed', 'subscription_created', 'subscription_cancelled', 'payment_received', 'entity_created', 'profile_updated', 'message_sent');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  company_name TEXT DEFAULT '',
  role user_role NOT NULL DEFAULT 'client',
  stripe_customer_id TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Entities table
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type entity_type NOT NULL DEFAULT 'business',
  industry TEXT,
  quickbooks_id TEXT,
  xero_id TEXT,
  status entity_status NOT NULL DEFAULT 'onboarding',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  plan plan_type NOT NULL DEFAULT 'essential',
  status subscription_status NOT NULL DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  entity_limit INTEGER NOT NULL DEFAULT 1,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  type document_type NOT NULL DEFAULT 'other',
  status document_status NOT NULL DEFAULT 'uploaded',
  notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ
);

-- Activities table
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  type activity_type NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_entities_user ON entities(user_id);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_documents_entity ON documents(entity_id);
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_activities_created ON activities(created_at DESC);
CREATE INDEX idx_messages_to ON messages(to_user_id);
CREATE INDEX idx_messages_from ON messages(from_user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER entities_updated_at BEFORE UPDATE ON entities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, company_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- Row Level Security Policies
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (id = auth.uid() OR is_admin());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Service role can insert profiles" ON profiles FOR INSERT WITH CHECK (TRUE);

-- Entities policies
CREATE POLICY "Users can view own entities" ON entities FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Users can create own entities" ON entities FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own entities" ON entities FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Users can delete own entities" ON entities FOR DELETE USING (user_id = auth.uid());

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Service role manages subscriptions" ON subscriptions FOR ALL USING (TRUE);

-- Documents policies
CREATE POLICY "Users can view own documents" ON documents FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Users can upload documents" ON documents FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own documents" ON documents FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admins can update documents" ON documents FOR UPDATE USING (is_admin());

-- Activities policies
CREATE POLICY "Users can view own activities" ON activities FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Activities can be inserted" ON activities FOR INSERT WITH CHECK (TRUE);

-- Messages policies
CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid() OR is_admin());
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (from_user_id = auth.uid());
CREATE POLICY "Users can mark messages read" ON messages FOR UPDATE USING (to_user_id = auth.uid());

-- =============================================
-- Storage Bucket for Documents
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', FALSE);

CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can view all files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND is_admin()
  );
```

**Step 2: Run the SQL in Supabase**

The user must:
1. Go to https://supabase.com/dashboard → their project → SQL Editor
2. Paste the entire `supabase/schema.sql` content
3. Click "Run"

**Step 3: Seed the admin user**

The user must go to Supabase Dashboard → Authentication → Users → "Add user" and create:
- Email: `catchjagdish@gmail.com`
- Password: `dilseI@1007`

Then run this SQL to set the admin role:
```sql
UPDATE profiles SET role = 'admin', full_name = 'Jagdish Lade', company_name = 'BookkeeperAI' WHERE email = 'catchjagdish@gmail.com';
```

**Step 4: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: Add complete database schema with RLS policies"
```

---

## Task 4: Database Types

**Files:**
- Create: `src/lib/supabase/types.ts` — TypeScript types matching the database schema

**Step 1: Create `src/lib/supabase/types.ts`**

```typescript
export type UserRole = "client" | "cpa" | "admin" | "employee";
export type EntityType = "business" | "individual";
export type EntityStatus = "active" | "onboarding" | "paused";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "cancelled" | "incomplete";
export type PlanType = "starter" | "growth" | "enterprise" | "essential" | "professional" | "premium";
export type DocumentType = "invoice" | "receipt" | "bank_statement" | "tax_form" | "payroll" | "other";
export type DocumentStatus = "uploaded" | "processing" | "reviewed" | "approved" | "rejected";
export type ActivityType = "account_created" | "login" | "document_uploaded" | "document_status_changed" | "subscription_created" | "subscription_cancelled" | "payment_received" | "entity_created" | "profile_updated" | "message_sent";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  company_name: string;
  role: UserRole;
  stripe_customer_id: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Entity {
  id: string;
  user_id: string;
  name: string;
  type: EntityType;
  industry: string | null;
  quickbooks_id: string | null;
  xero_id: string | null;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan: PlanType;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_start: string;
  current_period_end: string;
  entity_limit: number;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  entity_id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  type: DocumentType;
  status: DocumentStatus;
  notes: string | null;
  uploaded_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface Activity {
  id: string;
  user_id: string;
  entity_id: string | null;
  type: ActivityType;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Message {
  id: string;
  from_user_id: string;
  to_user_id: string;
  entity_id: string | null;
  subject: string;
  body: string;
  read_at: string | null;
  created_at: string;
}
```

**Step 2: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "feat: Add TypeScript database types"
```

---

## Task 5: Auth Middleware

**Files:**
- Create: `src/middleware.ts` — Next.js middleware for route protection
- Modify: `src/lib/auth.ts` — update to use Supabase types

**Step 1: Create `src/middleware.ts`**

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_ROUTES = ["/", "/pricing", "/about", "/contact", "/login", "/get-started", "/admin/login"];
const STATIC_PREFIXES = ["/api/", "/_next/", "/favicon.ico", "/images/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and API routes
  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Skip public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    const { supabaseResponse } = await updateSession(request);
    return supabaseResponse;
  }

  // Protected routes — check auth
  const { supabaseResponse, user, supabase } = await updateSession(request);

  if (!user) {
    const loginUrl = pathname.startsWith("/admin")
      ? new URL("/admin/login", request.url)
      : new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Fetch profile for role check
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;

  // Role-based access
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (pathname.startsWith("/cpa") && role !== "cpa" && role !== "admin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/dashboard") && !["client", "cpa", "admin"].includes(role || "")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

**Step 2: Update `src/lib/auth.ts`**

Keep the existing `ROLE_PERMISSIONS`, `getRoleDashboardPath`, `getRoleLabel` functions but update the `User` interface to align with the `Profile` type from Supabase. Remove the old `AuthSession` type.

**Step 3: Commit**

```bash
git add src/middleware.ts src/lib/auth.ts
git commit -m "feat: Add auth middleware with role-based route protection"
```

---

## Task 6: Registration Page (/get-started)

**Files:**
- Create: `src/app/get-started/page.tsx` — registration form with Supabase auth
- Create: `src/app/api/auth/register/route.ts` — server-side registration handler

**Step 1: Create `src/app/api/auth/register/route.ts`**

This endpoint:
1. Creates the user via Supabase auth
2. Creates a default entity (company name)
3. Creates a free trial subscription (14 days, 1 entity)
4. Logs an activity
5. Sends welcome email via Resend

```typescript
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const { fullName, email, companyName, password } = await request.json();

    if (!fullName || !email || !password || !companyName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const supabase = await createServiceRoleClient();

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, company_name: companyName, role: "client" },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // Create default entity
    const { data: entity } = await supabase
      .from("entities")
      .insert({ user_id: userId, name: companyName, type: "business", status: "onboarding" })
      .select()
      .single();

    // Create free trial subscription
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    await supabase.from("subscriptions").insert({
      user_id: userId,
      plan: "essential",
      status: "trialing",
      trial_ends_at: trialEnd.toISOString(),
      current_period_end: trialEnd.toISOString(),
      entity_limit: 1,
    });

    // Log activity
    await supabase.from("activities").insert({
      user_id: userId,
      entity_id: entity?.id,
      type: "account_created",
      description: `Account created for ${companyName}`,
    });

    // Send welcome email
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "BookkeeperAI <onboarding@resend.dev>",
        to: email,
        subject: "Welcome to BookkeeperAI — Your 14-Day Free Trial",
        html: `
          <div style="font-family: system-ui; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #050a18; font-size: 24px;">Welcome to BookkeeperAI, ${fullName}!</h1>
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">
              Your 14-day free trial has started. Here's what you can do:
            </p>
            <ul style="color: #334155; font-size: 16px; line-height: 1.8;">
              <li>Upload documents for your entity: <strong>${companyName}</strong></li>
              <li>Track your bookkeeping pipeline in real-time</li>
              <li>Get AI-powered financial insights</li>
            </ul>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #14b8a6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
              Go to Dashboard →
            </a>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 32px;">
              Need help? Reply to this email or chat with us on the website.
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Failed to send welcome email:", emailErr);
    }

    // Notify admin
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "BookkeeperAI <onboarding@resend.dev>",
        to: "catchjagdish@gmail.com",
        subject: `New Signup: ${companyName} (${email})`,
        html: `<p>New user signed up: <strong>${fullName}</strong> (${email}) — Company: ${companyName}</p>`,
      });
    } catch {
      // Non-critical
    }

    return NextResponse.json({ success: true, userId });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
```

**Step 2: Create `src/app/get-started/page.tsx`**

A registration form matching the existing design system (glass-card, navy bg, teal accents). Fields: Full Name, Email, Company Name, Password, Confirm Password. On submit, POST to `/api/auth/register`, then auto-login via Supabase client and redirect to `/dashboard`.

Use the same visual structure as the existing `src/app/login/page.tsx` — gradient mesh background, glass-card form, teal CTA button.

**Step 3: Commit**

```bash
git add src/app/get-started/ src/app/api/auth/register/
git commit -m "feat: Add registration page with free trial creation"
```

---

## Task 7: Login Pages (Customer + Admin)

**Files:**
- Modify: `src/app/login/page.tsx` — replace demo auth with Supabase auth
- Create: `src/app/admin/login/page.tsx` — admin-only login page
- Modify: `src/app/api/auth/route.ts` — replace demo with Supabase
- Create: `src/app/api/auth/callback/route.ts` — Supabase auth callback

**Step 1: Rewrite `src/app/login/page.tsx`**

Remove demo credentials. Remove the role selector (role is determined from profile, not user input). Replace the `handleSubmit` to use Supabase `signInWithPassword`. After login, fetch profile role and redirect to the correct dashboard.

Keep the existing visual design (glass-card, gradient mesh, teal button). Change the "Start Free Trial" link to point to `/get-started`. Remove the "Demo Credentials" box.

**Step 2: Create `src/app/admin/login/page.tsx`**

Same visual design as login page but:
- Title: "Admin Access"
- No role selector
- After Supabase login, fetch profile and verify role === 'admin'
- If not admin, show error "Access denied. Admin credentials required."
- If admin, redirect to `/admin`
- Add a subtle "← Back to site" link
- Do NOT show this page in the navbar

**Step 3: Create `src/app/api/auth/callback/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/dashboard";

  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${redirect}`);
}
```

**Step 4: Update `src/app/api/auth/route.ts`**

Replace the demo user lookup with Supabase `signInWithPassword` and profile role lookup:

```typescript
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const supabase = await createServiceRoleClient();

    // Verify credentials exist by looking up the user
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users?.find((u) => u.email === email);

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Fetch profile for role-based redirect
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role || "client";
    const redirectTo = role === "cpa" ? "/cpa" : role === "admin" ? "/admin" : "/dashboard";

    return NextResponse.json({
      user: { id: user.id, email, role },
      redirectTo,
    });
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
```

**Step 5: Commit**

```bash
git add src/app/login/ src/app/admin/login/ src/app/api/auth/
git commit -m "feat: Real auth with Supabase - customer + admin login"
```

---

## Task 8: Dashboard with Real Data

**Files:**
- Modify: `src/app/dashboard/page.tsx` — fetch real data from Supabase
- Modify: `src/components/dashboard/Sidebar.tsx` — show real user info, real entity list
- Create: `src/app/dashboard/layout.tsx` — shared layout with auth check

**Step 1: Create `src/app/dashboard/layout.tsx`**

Server component that checks Supabase session, fetches profile + entities + subscription, and passes them as context (or props to client components). Redirects to `/login` if unauthenticated.

**Step 2: Modify `src/app/dashboard/page.tsx`**

Replace all hardcoded mock data with real Supabase queries:
- Status cards: count of documents by status for user's entities
- Financial summary: keep as illustrative (we don't have real financials yet), but show subscription info
- Activities: fetch from `activities` table
- Pipeline: count documents by status
- Welcome message: show real user name from profile

**Step 3: Modify Sidebar**

Show real user name, email, and entity list from Supabase. The entity switcher dropdown should list real entities.

**Step 4: Commit**

```bash
git add src/app/dashboard/ src/components/dashboard/
git commit -m "feat: Dashboard with real Supabase data"
```

---

## Task 9: Document Upload Page

**Files:**
- Create: `src/app/dashboard/documents/page.tsx` — document list + upload UI
- Create: `src/app/api/documents/upload/route.ts` — upload handler
- Create: `src/app/api/documents/route.ts` — list documents

**Step 1: Create `src/app/api/documents/upload/route.ts`**

Handles multipart form upload:
1. Receive file via FormData
2. Upload to Supabase Storage bucket `documents` in folder `{userId}/{entityId}/`
3. Create `documents` record in database
4. Log activity (document_uploaded)
5. Send "document received" email via Resend
6. Return the document record

**Step 2: Create `src/app/api/documents/route.ts`**

GET handler that returns documents for the authenticated user, with optional entity_id filter.

**Step 3: Create `src/app/dashboard/documents/page.tsx`**

Client component with:
- Drag-and-drop upload zone (styled with glass-card, teal dashed border)
- File type selector (invoice, receipt, bank_statement, etc.)
- Entity selector dropdown (from user's entities)
- Document list table showing: file name, type, status badge, uploaded date, actions
- Status badges color-coded: uploaded=gold, processing=cyan, reviewed=teal, approved=green, rejected=coral
- Upload progress indicator
- Real data from Supabase

**Step 4: Commit**

```bash
git add src/app/dashboard/documents/ src/app/api/documents/
git commit -m "feat: Document upload and management with Supabase Storage"
```

---

## Task 10: Billing Page & Stripe Integration

**Files:**
- Create: `src/app/dashboard/billing/page.tsx` — subscription management
- Modify: `src/app/api/stripe/route.ts` — real Stripe checkout session
- Create: `src/app/api/stripe/webhook/route.ts` — Stripe webhook handler
- Create: `src/app/api/stripe/portal/route.ts` — customer portal

**Step 1: Create `src/app/api/stripe/webhook/route.ts`**

Handle these Stripe events:
- `checkout.session.completed` — create/update subscription in DB, send confirmation email
- `customer.subscription.updated` — update status, period dates
- `customer.subscription.deleted` — mark cancelled, send cancellation email
- `invoice.payment_succeeded` — log payment activity
- `invoice.payment_failed` — send warning email

Must use `request.text()` (not `.json()`) and verify webhook signature with `stripe.webhooks.constructEvent`.

**Step 2: Rewrite `src/app/api/stripe/route.ts`**

Real Stripe Checkout Session creation:
1. Get authenticated user from Supabase
2. Create or retrieve Stripe customer (save `stripe_customer_id` to profiles)
3. Create Checkout Session with selected price ID, trial period if applicable
4. Return checkout URL

**Step 3: Create `src/app/api/stripe/portal/route.ts`**

Create Stripe Customer Portal session for self-service plan management.

**Step 4: Create `src/app/dashboard/billing/page.tsx`**

Shows:
- Current plan name + status badge (trialing/active/cancelled)
- Trial countdown (if trialing)
- Entity usage (X of Y entities used)
- "Upgrade Plan" button → Stripe Checkout
- "Manage Subscription" button → Stripe Customer Portal
- Payment history (from activities table)

**Step 5: Commit**

```bash
git add src/app/dashboard/billing/ src/app/api/stripe/
git commit -m "feat: Full Stripe integration - checkout, webhooks, portal"
```

---

## Task 11: Settings Page

**Files:**
- Create: `src/app/dashboard/settings/page.tsx` — profile settings

**Step 1: Create the settings page**

Shows:
- Profile form (full name, email (read-only), phone, company name)
- Save button → updates `profiles` table via Supabase
- Change password section → Supabase `updateUser`
- Danger zone: delete account

Use existing glass-card design, teal accents.

**Step 2: Commit**

```bash
git add src/app/dashboard/settings/
git commit -m "feat: Add profile settings page"
```

---

## Task 12: Admin Dashboard with Real Data

**Files:**
- Modify: `src/app/admin/page.tsx` — replace mock data with Supabase queries
- Create: `src/app/admin/users/page.tsx` — user management
- Create: `src/app/api/admin/users/route.ts` — admin user API
- Create: `src/app/api/admin/stats/route.ts` — admin KPI API

**Step 1: Create `src/app/api/admin/stats/route.ts`**

Returns real KPIs:
- Total users count
- Active subscriptions count
- MRR (sum of active subscription amounts)
- Documents by status count
- Recent signups (last 30 days)
All queries use service role client and verify caller is admin.

**Step 2: Create `src/app/api/admin/users/route.ts`**

GET: List all users with their profiles, subscription status, entity count.
PATCH: Update user role or status (admin only).

**Step 3: Modify `src/app/admin/page.tsx`**

Replace all hardcoded KPIs, work queue, team data with real Supabase queries.
- KPI cards: real counts from admin stats API
- Work queue: real document counts by status
- Recent alerts: real activities from activities table
- Keep team performance as mock for now (no employee tracking yet)

**Step 4: Create `src/app/admin/users/page.tsx`**

Table of all users:
- Columns: Name, Email, Company, Role badge, Plan, Status, Entities count, Joined date
- Actions: Change role dropdown, view details
- Search/filter by name or email

**Step 5: Commit**

```bash
git add src/app/admin/ src/app/api/admin/
git commit -m "feat: Admin dashboard and user management with real data"
```

---

## Task 13: Email Templates

**Files:**
- Create: `src/lib/emails/welcome.tsx` — welcome email template
- Create: `src/lib/emails/document-received.tsx` — document upload confirmation
- Create: `src/lib/emails/document-reviewed.tsx` — document status change
- Create: `src/lib/emails/subscription-confirmed.tsx` — payment confirmation
- Create: `src/lib/emails/trial-ending.tsx` — trial expiry warning
- Create: `src/lib/emails/send.ts` — centralized email sending utility

**Step 1: Create `src/lib/emails/send.ts`**

Centralized function that accepts template name + data, renders the React Email component, sends via Resend.

**Step 2: Create email templates**

Each template is a React component using `@react-email/components` with the BookkeeperAI brand:
- Navy/teal color scheme
- Logo text "BookkeeperAI" at top
- Clean, professional layout
- Clear CTA button in teal
- Footer with company info

**Step 3: Update registration, document upload, and Stripe webhook handlers**

Replace inline HTML emails with the React Email templates.

**Step 4: Commit**

```bash
git add src/lib/emails/
git commit -m "feat: React Email templates for all transactional emails"
```

---

## Task 14: Contact Form (Real Email)

**Files:**
- Create: `src/app/api/contact/route.ts` — handle contact form submission
- Modify: `src/app/contact/page.tsx` — wire up form to API

**Step 1: Create `src/app/api/contact/route.ts`**

POST handler that:
1. Validates form data (name, email, company, message)
2. Sends email to `accounts@sms360s.com` via Resend
3. Sends confirmation email to the submitter
4. Returns success

**Step 2: Modify `src/app/contact/page.tsx`**

Wire the existing contact form to POST to `/api/contact`. Add loading state, success message, and error handling.

**Step 3: Commit**

```bash
git add src/app/api/contact/ src/app/contact/
git commit -m "feat: Contact form sends real emails via Resend"
```

---

## Task 15: Tawk.to Live Chat Widget

**Files:**
- Create: `src/components/TawkTo.tsx` — Tawk.to widget component
- Modify: `src/app/layout.tsx` — add TawkTo component

**Step 1: Create `src/components/TawkTo.tsx`**

```typescript
"use client";

import { useEffect } from "react";

export default function TawkTo() {
  useEffect(() => {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://embed.tawk.to/${process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID}/${process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID}`;
    s.charset = "UTF-8";
    s.setAttribute("crossorigin", "*");
    document.head.appendChild(s);

    return () => {
      document.head.removeChild(s);
    };
  }, []);

  return null;
}
```

**Step 2: Modify `src/app/layout.tsx`**

Add `<TawkTo />` inside the `<body>` tag, after `{children}`.

**Step 3: Commit**

```bash
git add src/components/TawkTo.tsx src/app/layout.tsx
git commit -m "feat: Add Tawk.to live chat widget"
```

---

## Task 16: Logout & Session Management

**Files:**
- Create: `src/app/api/auth/logout/route.ts` — sign out endpoint
- Modify: all sidebar components — wire logout buttons to real sign out

**Step 1: Create `src/app/api/auth/logout/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL));
}
```

**Step 2: Update sidebar LogOut buttons**

In `Sidebar.tsx` and admin sidebar, change the LogOut link/button to call `supabase.auth.signOut()` then redirect to `/login`.

**Step 3: Commit**

```bash
git add src/app/api/auth/logout/ src/components/dashboard/Sidebar.tsx src/app/admin/page.tsx
git commit -m "feat: Real logout with Supabase session cleanup"
```

---

## Task 17: Activity Logging

**Files:**
- Create: `src/lib/activities.ts` — helper to log activities

**Step 1: Create `src/lib/activities.ts`**

```typescript
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { ActivityType } from "@/lib/supabase/types";

export async function logActivity(params: {
  userId: string;
  entityId?: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createServiceRoleClient();
  await supabase.from("activities").insert({
    user_id: params.userId,
    entity_id: params.entityId || null,
    type: params.type,
    description: params.description,
    metadata: params.metadata || null,
  });
}
```

**Step 2: Add activity logging calls**

Add `logActivity()` calls to:
- Registration (account_created) — already done in Task 6
- Login (login) — add to login flow
- Document upload (document_uploaded)
- Document status change (document_status_changed)
- Subscription created (subscription_created) — in Stripe webhook
- Entity created (entity_created)

**Step 3: Commit**

```bash
git add src/lib/activities.ts
git commit -m "feat: Centralized activity logging"
```

---

## Task 18: Update Workstatus.md

**Files:**
- Modify: `Workstatus.md` — update with all completed work

**Step 1: Update Workstatus.md**

Add a new section documenting:
- All backend infrastructure (Supabase, Stripe, Resend)
- Database schema details
- API routes created
- Auth flow (registration, login, admin login)
- Document upload flow
- Email templates
- Tawk.to integration
- Environment variables needed
- Admin access path: `/admin/login`
- What's still needed for future phases

**Step 2: Commit and push**

```bash
git add Workstatus.md
git commit -m "docs: Update Workstatus.md with full-stack implementation details"
git push origin main
```

---

## Task Summary

| # | Task | New Files | Modified Files |
|---|------|-----------|---------------|
| 1 | Install dependencies | — | package.json |
| 2 | Supabase + Resend clients | 4 | .env.example |
| 3 | Database schema SQL | 1 | — |
| 4 | TypeScript DB types | 1 | — |
| 5 | Auth middleware | 1 | auth.ts |
| 6 | Registration page | 2 | — |
| 7 | Login pages (customer + admin) | 2 | login/page.tsx, api/auth/route.ts |
| 8 | Dashboard with real data | 1 | dashboard/page.tsx, Sidebar.tsx |
| 9 | Document upload | 3 | — |
| 10 | Stripe integration | 3 | api/stripe/route.ts |
| 11 | Settings page | 1 | — |
| 12 | Admin dashboard + users | 3 | admin/page.tsx |
| 13 | Email templates | 6 | — |
| 14 | Contact form | 1 | contact/page.tsx |
| 15 | Tawk.to widget | 1 | layout.tsx |
| 16 | Logout | 1 | Sidebar.tsx, admin/page.tsx |
| 17 | Activity logging | 1 | — |
| 18 | Update Workstatus.md | — | Workstatus.md |

**Total: ~30 new files, ~8 modified files, 18 commits**

## Pre-Requisites for the Implementer

Before starting, the user MUST:
1. Create a Supabase project at https://supabase.com/dashboard
2. Copy the project URL, anon key, and service role key to `.env.local`
3. Create a Stripe account and get test API keys
4. Create a Resend account at https://resend.com and get an API key
5. Run the `supabase/schema.sql` in the Supabase SQL Editor
6. Seed the admin user (email: catchjagdish@gmail.com, password: dilseI@1007)
