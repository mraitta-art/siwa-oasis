-- Phone-first vendor identity.
--
-- Vendors live on WhatsApp, not email. This makes the (already UNIQUE) phone
-- column the account key: a vendor registers and logs in with just their number,
-- proved by a one-time code sent on WhatsApp. No email is collected on the phone.
--
-- Two things had to change to allow an account with no email and no password:
--   * profiles.email       NOT NULL -> NULL  (unique index still allows many NULLs)
--   * profiles.password_hash NOT NULL -> NULL (phone-only accounts have neither;
--     the password login path compares against a hash that is now optionally
--     absent, and simply fails closed for those rows — it can never grant access)
--
-- phone_verified_at records the moment a number was proven by OTP. email_verified_at
-- is added now so the future laptop/desktop step needs no second migration.
--
-- vendor_otps stores one-time codes. Only the SHA-256 of the code is kept (peppered
-- with the app secret), never the plain code, and never logged. One active code per
-- (target, purpose); issuing a new one consumes the previous. Attempts are capped so
-- a leaked row cannot be brute-forced.

ALTER TABLE profiles MODIFY COLUMN email VARCHAR(255) NULL;
ALTER TABLE profiles MODIFY COLUMN password_hash VARCHAR(255) NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified_at DATETIME DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified_at DATETIME DEFAULT NULL;

CREATE TABLE IF NOT EXISTS vendor_otps (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  target        VARCHAR(64)  NOT NULL,
  channel       ENUM('whatsapp','email') NOT NULL DEFAULT 'whatsapp',
  purpose       ENUM('login','email_verify') NOT NULL DEFAULT 'login',
  code_hash     VARCHAR(128) NOT NULL,
  attempts      INT          NOT NULL DEFAULT 0,
  max_attempts  INT          NOT NULL DEFAULT 5,
  expires_at    DATETIME     NOT NULL,
  consumed_at   DATETIME     DEFAULT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vendor_otps_target (target, purpose, consumed_at),
  INDEX idx_vendor_otps_expiry (expires_at)
);
