-- Migration: Create field_requests table to receive custom field requirements from vendors
CREATE TABLE IF NOT EXISTS field_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id VARCHAR(36) NOT NULL,
  vendor_id VARCHAR(36) NOT NULL,
  section_id VARCHAR(100) NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  field_label VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL,
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES profiles(id) ON DELETE CASCADE
);
