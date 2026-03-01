-- Add currency field to projects table
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

-- Optional: constrain to supported currencies
ALTER TABLE projects
  ADD CONSTRAINT projects_currency_check
  CHECK (currency IN ('USD', 'EUR', 'SAR', 'EGP', 'GBP'));
