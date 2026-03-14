# BookkeeperAI Full-Stack Backend Design

**Date:** 2026-03-14
**Status:** Approved
**Author:** Claude (AI Agent)
**Approved by:** Hardik Mehta

## Overview

Transform BookkeeperAI from a frontend-only prototype into a fully functional SaaS platform with real authentication, database, payments, document management, email notifications, and admin controls.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion |
| Auth | Supabase Auth (email/password) |
| Database | Supabase PostgreSQL with Row Level Security |
| File Storage | Supabase Storage (document uploads) |
| Payments | Stripe (subscriptions, checkout, customer portal, webhooks) |
| Emails | Resend + React Email templates |
| Live Chat | Tawk.to (Property: 69b5f3f81689cc1c37408f2a, Widget: 1jjnc208q) |
| Deployment | Netlify + GitHub Actions CI/CD |

## Database Schema

### profiles (extends Supabase auth.users)
- id (UUID, FK to auth.users.id)
- email (text)
- full_name (text)
- phone (text)
- company_name (text)
- role (enum: client, cpa, admin, employee)
- stripe_customer_id (text, nullable)
- avatar_url (text, nullable)
- onboarding_completed (boolean, default false)
- created_at (timestamptz)
- updated_at (timestamptz)

### entities
- id (UUID, PK)
- user_id (UUID, FK to profiles.id)
- name (text)
- type (enum: business, individual)
- industry (text, nullable)
- quickbooks_id (text, nullable)
- xero_id (text, nullable)
- status (enum: active, onboarding, paused)
- created_at (timestamptz)
- updated_at (timestamptz)

### subscriptions
- id (UUID, PK)
- user_id (UUID, FK to profiles.id)
- stripe_subscription_id (text, unique)
- stripe_price_id (text)
- plan_type (enum: starter, growth, enterprise, essential, professional, premium)
- status (enum: trialing, active, past_due, cancelled, incomplete)
- trial_ends_at (timestamptz, nullable)
- current_period_start (timestamptz)
- current_period_end (timestamptz)
- entity_limit (integer)
- cancel_at_period_end (boolean, default false)
- created_at (timestamptz)
- updated_at (timestamptz)

### documents
- id (UUID, PK)
- entity_id (UUID, FK to entities.id)
- user_id (UUID, FK to profiles.id)
- file_name (text)
- file_url (text — Supabase Storage path)
- file_size (bigint)
- mime_type (text)
- type (enum: invoice, receipt, bank_statement, tax_form, payroll, other)
- status (enum: uploaded, processing, reviewed, approved, rejected)
- notes (text, nullable)
- uploaded_at (timestamptz)
- reviewed_by (UUID, FK to profiles.id, nullable)
- reviewed_at (timestamptz, nullable)

### activities
- id (UUID, PK)
- user_id (UUID, FK to profiles.id)
- entity_id (UUID, FK to entities.id, nullable)
- type (enum: account_created, login, document_uploaded, document_status_changed, subscription_created, subscription_cancelled, payment_received, entity_created, profile_updated, message_sent)
- description (text)
- metadata (jsonb, nullable)
- created_at (timestamptz)

### messages
- id (UUID, PK)
- from_user_id (UUID, FK to profiles.id)
- to_user_id (UUID, FK to profiles.id)
- entity_id (UUID, FK to entities.id, nullable)
- subject (text)
- body (text)
- read_at (timestamptz, nullable)
- created_at (timestamptz)

## Row Level Security (RLS) Policies

- **profiles:** Users can read/update own profile. Admins can read all.
- **entities:** Users can CRUD own entities. Admins can read all.
- **subscriptions:** Users can read own. Admins can read/update all.
- **documents:** Users can CRUD documents for own entities. Admins can read/update all.
- **activities:** Users can read own. Admins can read all.
- **messages:** Users can read messages to/from themselves. Admins can read all.

## Authentication Flows

### Customer Registration (/get-started)
1. Form: full_name, email, company_name, password
2. Supabase auth.signUp() → creates auth.users record
3. Database trigger creates profiles record (role: client)
4. Auto-creates 1 entity with company_name
5. Auto-creates subscription (status: trialing, 14 days, 1 entity limit)
6. Resend sends welcome email + verification
7. Redirect to /dashboard

### Customer Login (/login)
1. Form: email, password
2. Supabase auth.signInWithPassword()
3. Fetch profile → redirect by role (/dashboard, /cpa)
4. Log activity (type: login)

### Admin Login (/admin/login)
1. Separate hidden page, not linked from nav
2. Same Supabase auth, but checks role === 'admin'
3. Rejects non-admin users with error
4. Seed admin: catchjagdish@gmail.com / dilseI@1007

### Session Management
- Supabase handles JWT tokens automatically
- Next.js middleware checks auth on protected routes
- Role-based redirects in middleware

## Stripe Integration

### Checkout Flow
1. User clicks "Upgrade" or selects plan on /pricing
2. POST /api/stripe/checkout → creates Stripe Checkout Session
3. Stripe handles payment collection
4. Webhook (checkout.session.completed) → creates/updates subscription record
5. Resend sends confirmation email

### Webhook Events Handled
- checkout.session.completed → create subscription
- customer.subscription.updated → update status/period
- customer.subscription.deleted → mark cancelled
- invoice.payment_succeeded → log payment activity
- invoice.payment_failed → send warning email

### Customer Portal
- POST /api/stripe/portal → creates Stripe Customer Portal session
- Users can update payment, change plan, cancel

### Free Trial
- 14 days, 1 entity, no credit card required
- Cron/scheduled check for trial expiry (Supabase Edge Function or webhook)
- Email at 3 days before expiry

## API Routes

### Auth
- POST /api/auth/register — Sign up new customer
- POST /api/auth/login — Sign in (not needed if using Supabase client-side)
- POST /api/auth/logout — Sign out
- GET /api/auth/callback — Supabase OAuth callback

### Stripe
- POST /api/stripe/checkout — Create checkout session
- POST /api/stripe/portal — Create customer portal session
- POST /api/stripe/webhook — Handle Stripe webhooks

### Documents
- POST /api/documents/upload — Upload to Supabase Storage + create record
- GET /api/documents — List user's documents
- PATCH /api/documents/[id] — Update status (admin)
- DELETE /api/documents/[id] — Delete document

### Entities
- POST /api/entities — Create entity
- GET /api/entities — List user's entities
- PATCH /api/entities/[id] — Update entity
- DELETE /api/entities/[id] — Delete entity

### Admin
- GET /api/admin/users — List all users (admin only)
- GET /api/admin/stats — Dashboard KPIs (admin only)
- PATCH /api/admin/users/[id] — Update user role/status

### Contact
- POST /api/contact — Handle contact form → send email via Resend

## Email Templates (Resend + React Email)

1. **welcome** — Account created, verify email
2. **trial-started** — 14-day trial details
3. **trial-ending** — 3 days before expiry, upgrade CTA
4. **document-received** — Confirmation of upload
5. **document-reviewed** — Status change notification
6. **subscription-confirmed** — Payment successful
7. **subscription-cancelled** — Cancellation confirmation
8. **payment-failed** — Update payment method CTA
9. **admin-new-user** — Notify admin of new signup
10. **contact-form** — Forward contact form to admin

## Page Routes (Complete)

### Public
- / — Landing page
- /pricing — Pricing page
- /about — About page
- /contact — Contact form
- /login — Customer & CPA login
- /get-started — Registration + free trial

### Protected (Client)
- /dashboard — Main dashboard
- /dashboard/documents — Document upload & management
- /dashboard/billing — Subscription, invoices, upgrade
- /dashboard/settings — Profile settings

### Protected (CPA)
- /cpa — CPA dashboard

### Protected (Admin)
- /admin/login — Admin-only login (hidden)
- /admin — Admin dashboard, KPIs
- /admin/users — User management

### API
- /api/auth/* — Auth endpoints
- /api/stripe/* — Stripe endpoints
- /api/documents/* — Document endpoints
- /api/entities/* — Entity endpoints
- /api/admin/* — Admin endpoints
- /api/contact — Contact form handler

## Tawk.to Integration

- Property ID: 69b5f3f81689cc1c37408f2a
- Widget ID: 1jjnc208q
- Embed as React component in root layout
- Show on all public pages
- Pass user info when authenticated (name, email)

## Middleware

Next.js middleware at src/middleware.ts:
- Check Supabase session on all /dashboard/*, /cpa/*, /admin/* routes
- Redirect unauthenticated users to /login
- /admin/* routes require role === 'admin' (redirect to /admin/login)
- /cpa/* routes require role === 'cpa'
- /dashboard/* routes require role === 'client'

## Implementation Priority

1. Supabase setup (project, schema, RLS, seed admin)
2. Auth (register, login, middleware, admin login)
3. Dashboard with real data (entities, documents)
4. Document upload (Supabase Storage)
5. Stripe integration (checkout, webhooks, portal)
6. Email system (Resend templates, triggers)
7. Admin dashboard (real data, user management)
8. Tawk.to widget
9. Contact form (real email sending)
10. Activity logging & status updates
