-- Create website_configs table for hero carousel and other dynamic configs
CREATE TABLE IF NOT EXISTS website_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(100) UNIQUE NOT NULL,
  config JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default empty hero carousel config (optional)
INSERT IGNORE INTO website_configs (type, config) VALUES (
  'hero_carousel',
  '{"slides":[]}'
);
