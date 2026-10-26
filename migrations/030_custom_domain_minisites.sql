-- Custom domains for verified business minisites.
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255) DEFAULT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS custom_domain_verified TINYINT(1) NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS uq_businesses_custom_domain
  ON businesses (custom_domain);

CREATE INDEX IF NOT EXISTS idx_businesses_custom_domain_verified
  ON businesses (custom_domain, custom_domain_verified);
