-- Migration 026: Visitor Analytics — Page Views Tracking
-- Tracks every page hit with visitor session, destination, device, and referrer

CREATE TABLE IF NOT EXISTS page_views (
  id              BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
  session_id      VARCHAR(64)   NOT NULL COMMENT 'Anonymous browser session fingerprint (cookie-based UUID)',
  visitor_id      VARCHAR(36)   DEFAULT NULL COMMENT 'Links to visitor_profiles.id if logged in',
  page_path       VARCHAR(500)  NOT NULL COMMENT 'URL path visited e.g. /, /my-hotel, /offers',
  page_type       VARCHAR(50)   NOT NULL DEFAULT 'other' COMMENT 'homepage, business, category, offers, packages, blog, admin, other',
  business_id     VARCHAR(36)   DEFAULT NULL COMMENT 'If visiting a business minisite, the business UUID',
  referrer        VARCHAR(1000) DEFAULT NULL COMMENT 'HTTP referrer — where the visitor came from',
  user_agent      VARCHAR(500)  DEFAULT NULL COMMENT 'Raw browser user-agent string',
  device_type     VARCHAR(20)   DEFAULT 'desktop' COMMENT 'Parsed: mobile, tablet, desktop',
  country         VARCHAR(100)  DEFAULT NULL COMMENT 'Derived from Accept-Language header',
  duration_ms     INT           DEFAULT NULL COMMENT 'Time spent on page in milliseconds (sent on navigation away)',
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_pv_created     (created_at),
  INDEX idx_pv_path        (page_path(191)),
  INDEX idx_pv_business    (business_id),
  INDEX idx_pv_session     (session_id),
  INDEX idx_pv_type        (page_type),
  INDEX idx_pv_device      (device_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
