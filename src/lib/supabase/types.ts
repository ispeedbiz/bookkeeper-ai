// =============================================
// BookkeeperAI Database Types
// Matches supabase/schema.sql
// =============================================

export type UserRole = "client" | "cpa" | "admin" | "employee";
export type EntityType = "business" | "individual";
export type EntityStatus = "active" | "onboarding" | "paused";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "cancelled" | "incomplete";
export type PlanType = "starter" | "growth" | "enterprise" | "essential" | "professional" | "premium";
export type DocumentType = "invoice" | "receipt" | "bank_statement" | "tax_form" | "payroll" | "other";
export type DocumentStatus = "uploaded" | "processing" | "reviewed" | "approved" | "rejected";
export type ActivityType =
  | "account_created"
  | "login"
  | "document_uploaded"
  | "document_status_changed"
  | "subscription_created"
  | "subscription_cancelled"
  | "payment_received"
  | "entity_created"
  | "profile_updated"
  | "message_sent";

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
