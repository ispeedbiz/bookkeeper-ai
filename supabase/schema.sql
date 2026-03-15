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
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
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
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    'client'::user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user error: %', SQLERRM;
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
CREATE POLICY "Users can insert own subscription" ON subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own subscription" ON subscriptions FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Admins can delete subscriptions" ON subscriptions FOR DELETE USING (is_admin());

-- Documents policies
CREATE POLICY "Users can view own documents" ON documents FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Users can upload documents" ON documents FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own documents" ON documents FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Users and admins can update documents" ON documents FOR UPDATE USING (user_id = auth.uid() OR is_admin());

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
