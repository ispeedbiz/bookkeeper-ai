-- =============================================
-- BookkeeperAI Schema Migration: AI & Integrations
-- Adds AI analysis fields, transactions table,
-- and integrations table for accounting software.
-- =============================================

-- Add AI analysis columns to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_analysis JSONB;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_document_type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_vendor TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_total_amount DECIMAL(12,2);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_currency TEXT DEFAULT 'CAD';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Transactions table (AI-extracted transactions from documents)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CAD',
  category TEXT NOT NULL DEFAULT 'Other',
  type TEXT NOT NULL CHECK (type IN ('debit', 'credit')),
  vendor TEXT,
  tax_relevant BOOLEAN NOT NULL DEFAULT FALSE,
  ai_confidence DECIMAL(3,2),
  reconciled BOOLEAN NOT NULL DEFAULT FALSE,
  synced_to TEXT, -- 'quickbooks', 'xero', 'zoho'
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_document ON transactions(document_id);
CREATE INDEX IF NOT EXISTS idx_transactions_entity ON transactions(entity_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- Trigger for transactions updated_at
CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Service role can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (user_id = auth.uid());

-- Integrations table (accounting software connections)
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('quickbooks', 'xero', 'zoho')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  realm_id TEXT, -- QuickBooks company ID
  tenant_id TEXT, -- Xero organization ID
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  connected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entity_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_integrations_entity ON integrations(entity_id);
CREATE INDEX IF NOT EXISTS idx_integrations_user ON integrations(user_id);

-- Trigger for integrations updated_at
CREATE TRIGGER integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS for integrations
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own integrations"
  ON integrations FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Service role can manage integrations"
  ON integrations FOR ALL
  USING (TRUE);

-- Enable Realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
