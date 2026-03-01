-- Migration 00010: FX rates for multi-currency cost control
-- Adds:
--   projects.usd_rate        — how many project-currency units equal 1 USD (for portfolio USD view)
--   cc_actuals.document_currency — currency the invoice/transaction was issued in
--   cc_actuals.fx_rate           — doc_currency → project_currency rate (doc_amount × fx_rate = project_amount)
--   cc_commitments.fx_rate       — same concept; currency column already stores document currency

-- ── Projects: USD exchange rate ─────────────────────────────────────────────
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS usd_rate DECIMAL(10,6) NOT NULL DEFAULT 1.0;

-- ── Actuals: document currency + FX rate ────────────────────────────────────
ALTER TABLE cc_actuals
  ADD COLUMN IF NOT EXISTS document_currency TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS fx_rate           DECIMAL(10,6) NOT NULL DEFAULT 1.0;

-- Back-fill: set document_currency = project currency for all existing records
-- (those amounts were entered in project currency, so fx_rate stays 1.0)
UPDATE cc_actuals a
SET document_currency = p.currency
FROM projects p
WHERE a.project_id = p.id;

-- ── Commitments: FX rate ─────────────────────────────────────────────────────
-- currency column already exists as the document currency
ALTER TABLE cc_commitments
  ADD COLUMN IF NOT EXISTS fx_rate DECIMAL(10,6) NOT NULL DEFAULT 1.0;
