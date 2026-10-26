-- Shared catalog composition: admins can build products from existing products.
CREATE TABLE IF NOT EXISTS tour_product_components (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id VARCHAR(36) NOT NULL,
  component_product_id VARCHAR(36) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  day_offset INT NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_product_component (product_id, component_product_id),
  FOREIGN KEY (product_id) REFERENCES tour_products(id) ON DELETE CASCADE,
  FOREIGN KEY (component_product_id) REFERENCES tour_products(id) ON DELETE RESTRICT,
  INDEX idx_component_product (component_product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
