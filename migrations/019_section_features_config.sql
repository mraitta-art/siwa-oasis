-- Add section feature configuration
ALTER TABLE sections ADD COLUMN IF NOT EXISTS has_miniblog BOOLEAN DEFAULT TRUE;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS miniblog_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS has_gallery BOOLEAN DEFAULT TRUE;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS gallery_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS curation_policy ENUM('auto_approve', 'manual_review', 'admin_only') DEFAULT 'manual_review';
ALTER TABLE sections ADD COLUMN IF NOT EXISTS vendor_permissions JSON DEFAULT '{"can_upload_images": true, "can_write_blogs": true, "can_edit_own": true}';
ALTER TABLE sections ADD COLUMN IF NOT EXISTS content_instructions MEDIUMTEXT;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS max_gallery_items INT DEFAULT 50;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS auto_publish_blogs BOOLEAN DEFAULT FALSE;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS auto_publish_images BOOLEAN DEFAULT FALSE;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS created_by_admin VARCHAR(100);
ALTER TABLE sections ADD INDEX IF NOT EXISTS idx_curation_policy (curation_policy);
ALTER TABLE sections ADD INDEX IF NOT EXISTS idx_gallery_enabled (gallery_enabled);
ALTER TABLE sections ADD INDEX IF NOT EXISTS idx_miniblog_enabled (miniblog_enabled);

-- Create table for section blogs/content
CREATE TABLE IF NOT EXISTS section_blogs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    section_id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL,
    vendor_id VARCHAR(100),
    content_manager_id VARCHAR(100),
    
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    content LONGTEXT,
    excerpt VARCHAR(500),
    featured_image_url VARCHAR(500),
    
    -- Publishing
    status ENUM('draft', 'pending_approval', 'published', 'rejected') DEFAULT 'draft',
    published_at TIMESTAMP NULL,
    approved_by_admin VARCHAR(100),
    approval_notes MEDIUMTEXT,
    
    -- SEO
    meta_description VARCHAR(160),
    meta_keywords VARCHAR(255),
    
    -- Stats
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_section_id (section_id),
    INDEX idx_business_id (business_id),
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_status (status),
    INDEX idx_published_at (published_at),
    INDEX idx_slug (slug),
    
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Create view for vendor section content management
CREATE OR REPLACE VIEW vw_section_content_manager AS
SELECT 
    s.id as section_id,
    s.name as section_name,
    s.has_miniblog,
    s.has_gallery,
    s.gallery_enabled,
    s.miniblog_enabled,
    s.curation_policy,
    s.vendor_permissions,
    s.content_instructions,
    COUNT(DISTINCT CASE WHEN sb.status = 'published' THEN sb.id END) as published_blogs,
    COUNT(DISTINCT CASE WHEN sb.status = 'draft' THEN sb.id END) as draft_blogs,
    COUNT(DISTINCT CASE WHEN vg.approval_status = 'approved' THEN vg.id END) as approved_images,
    COUNT(DISTINCT CASE WHEN vg.approval_status = 'pending' THEN vg.id END) as pending_approval_images
FROM sections s
LEFT JOIN section_blogs sb ON s.id = sb.section_id
LEFT JOIN vendor_gallery vg ON s.id = vg.section_id
GROUP BY s.id;
