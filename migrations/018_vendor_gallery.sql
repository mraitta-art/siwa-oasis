-- Migration 018: Vendor Gallery Management
-- Purpose: Store vendor-uploaded images and videos for sections

CREATE TABLE IF NOT EXISTS vendor_gallery (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    vendor_id VARCHAR(100) NOT NULL,
    section_id VARCHAR(36) NOT NULL,
    
    -- File information
    url VARCHAR(500) NOT NULL,
    file_size INT,
    mime_type VARCHAR(50),
    
    -- Metadata
    caption VARCHAR(255),
    is_hero BOOLEAN DEFAULT FALSE,
    upload_status ENUM('pending', 'processing', 'ready', 'failed') DEFAULT 'ready',
    
    -- Admin approval workflow for hero carousel
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by_admin VARCHAR(100),
    approval_notes MEDIUMTEXT,
    approved_at TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_section_id (section_id),
    INDEX idx_is_hero (is_hero),
    INDEX idx_approval_status (approval_status),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Feature subscription table (for coming soon notifications)
CREATE TABLE IF NOT EXISTS feature_subscriptions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL,
    feature VARCHAR(100) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_subscription (email, feature),
    INDEX idx_feature (feature),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create permission check for vendor gallery operations
CREATE OR REPLACE VIEW vw_vendor_gallery_summary AS
SELECT 
    vendor_id,
    section_id,
    COUNT(*) as total_images,
    SUM(CASE WHEN is_hero THEN 1 ELSE 0 END) as hero_count,
    SUM(file_size) as total_size_bytes,
    MAX(created_at) as last_upload
FROM vendor_gallery
GROUP BY vendor_id, section_id;
