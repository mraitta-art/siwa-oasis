-- Migration 018: Auction System for Visitor Requests
-- Purpose: Allow admin to open competitive auctions for visitor requests
--          Vendors bid to win exclusive access to visitor contact info
--          Revenue maximization through competitive bidding

-- ============================================
-- STEP 1: Create Auctions Table
-- ============================================

CREATE TABLE IF NOT EXISTS auctions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    recommendation_id VARCHAR(36) UNIQUE NOT NULL,
    
    -- Auction details
    title VARCHAR(255) NOT NULL,
    description MEDIUMTEXT,
    category VARCHAR(100),
    
    -- Pricing
    starting_price DECIMAL(10, 2) NOT NULL,
    current_price DECIMAL(10, 2),
    reserve_price DECIMAL(10, 2),
    min_bid_increment DECIMAL(10, 2) DEFAULT 50,
    
    -- Contact Visibility Control (NEW)
    show_visitor_contact BOOLEAN DEFAULT FALSE COMMENT 'Show or hide visitor contact during auction',
    contact_visibility_level ENUM(
        'none',          -- Contact completely hidden
        'partial',       -- Name only during auction
        'full',          -- All contact shown
        'email_only'     -- Email only, no phone
    ) DEFAULT 'none',
    admin_contact_email VARCHAR(255) COMMENT 'Where vendor replies go if contact hidden',
    
    -- Timing
    auction_start_time TIMESTAMP NOT NULL,
    auction_end_time TIMESTAMP NOT NULL,
    duration_days INT,
    is_extended BOOLEAN DEFAULT FALSE,
    extended_until TIMESTAMP NULL,
    
    -- Status
    status ENUM(
        'draft',           -- Preparing
        'open',            -- Taking bids
        'extended',        -- Extended due to activity
        'closed',          -- Ended
        'processing',      -- Determining winner
        'completed'        -- Winner assigned
    ) DEFAULT 'draft',
    
    -- Winner details
    winning_bid_id VARCHAR(36),
    winning_vendor_id VARCHAR(36),
    winning_bid_amount DECIMAL(10, 2),
    winner_notified BOOLEAN DEFAULT FALSE,
    winner_accepted BOOLEAN DEFAULT FALSE,
    winner_rejected BOOLEAN DEFAULT FALSE,
    
    -- Auction metrics
    total_bids INT DEFAULT 0,
    unique_bidders INT DEFAULT 0,
    replies_received INT DEFAULT 0 COMMENT 'Vendor replies received (if contact hidden)',
    price_increase_percent DECIMAL(5, 2),
    price_increase_amount DECIMAL(10, 2),
    
    -- Admin info
    opened_by_admin_id VARCHAR(36),
    admin_note MEDIUMTEXT,
    permit_contact_after_bid BOOLEAN DEFAULT FALSE COMMENT 'Require admin approval before vendor gets contact',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    INDEX idx_recommendation_id (recommendation_id),
    INDEX idx_status (status),
    INDEX idx_auction_end_time (auction_end_time),
    INDEX idx_winning_vendor_id (winning_vendor_id),
    INDEX idx_category (category),
    INDEX idx_contact_visibility (show_visitor_contact),
    
    FOREIGN KEY (recommendation_id) REFERENCES visitor_recommendations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 2: Create Auction Bids Table
-- ============================================

CREATE TABLE IF NOT EXISTS auction_bids (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    auction_id VARCHAR(36) NOT NULL,
    vendor_id VARCHAR(36) NOT NULL,
    
    bid_amount DECIMAL(10, 2) NOT NULL,
    bid_sequence INT,
    
    -- Duration commitment
    contract_duration_months INT DEFAULT 12,
    total_contract_value DECIMAL(12, 2) GENERATED ALWAYS AS (bid_amount * contract_duration_months) STORED,
    
    -- Bid status
    is_active BOOLEAN DEFAULT TRUE,
    is_winning_bid BOOLEAN DEFAULT FALSE,
    was_outbid BOOLEAN DEFAULT FALSE,
    
    -- Bid details
    vendor_notes TEXT,
    terms_accepted BOOLEAN DEFAULT TRUE,
    
    -- Bid timing
    bid_placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_auction_id (auction_id),
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_bid_amount (bid_amount),
    INDEX idx_is_winning_bid (is_winning_bid),
    INDEX idx_bid_placed_at (bid_placed_at),
    
    UNIQUE KEY unique_bid_id (id),
    FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendor_portal_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 3B: Create Vendor Replies Table (NEW)
-- ============================================

CREATE TABLE IF NOT EXISTS auction_vendor_replies (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    auction_id VARCHAR(36) NOT NULL,
    vendor_id VARCHAR(36) NOT NULL,
    
    -- Reply from vendor (when contact is hidden)
    reply_subject VARCHAR(255),
    reply_message MEDIUMTEXT,
    bid_amount DECIMAL(10, 2),
    
    -- Reply status
    reply_status ENUM(
        'received',           -- Initial reply from vendor
        'admin_reviewed',     -- Admin read it
        'contact_permitted',  -- Admin approved vendor contact
        'contact_denied',     -- Admin denied access
        'responded'           -- Admin responded to vendor
    ) DEFAULT 'received',
    
    -- Contact permission
    contact_permitted BOOLEAN DEFAULT FALSE,
    contact_permitted_at TIMESTAMP NULL,
    contact_permitted_by_admin_id VARCHAR(36),
    admin_reason TEXT,
    
    -- Visitor contact released
    visitor_contact_shared BOOLEAN DEFAULT FALSE,
    visitor_contact_shared_at TIMESTAMP NULL,
    
    -- Admin response
    admin_response_message MEDIUMTEXT,
    admin_responded_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_auction_id (auction_id),
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_reply_status (reply_status),
    INDEX idx_contact_permitted (contact_permitted),
    
    FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendor_portal_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 4: Create Auction Winners Table
-- ============================================

CREATE TABLE IF NOT EXISTS auction_winners (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    auction_id VARCHAR(36) UNIQUE NOT NULL,
    bid_id VARCHAR(36) NOT NULL,
    vendor_id VARCHAR(36) NOT NULL,
    
    winning_bid_amount DECIMAL(10, 2),
    contract_duration_months INT DEFAULT 12,
    total_value DECIMAL(12, 2),
    
    -- Winner status
    winner_status ENUM(
        'won',             -- Auction won
        'accepted',        -- Winner accepted terms
        'rejected',        -- Winner rejected
        'active',          -- Contract active
        'completed',       -- Contract completed
        'cancelled'        -- Contract cancelled
    ) DEFAULT 'won',
    
    -- Contract dates
    contract_start_date DATE,
    contract_end_date DATE,
    
    -- Visitor data unlocked
    visitor_data_shared BOOLEAN DEFAULT FALSE,
    visitor_data_shared_at TIMESTAMP NULL,
    
    -- Visitor contact info (stored securely)
    visitor_id VARCHAR(36),
    visitor_name VARCHAR(255),
    visitor_email VARCHAR(255),
    visitor_phone VARCHAR(20),
    visitor_country VARCHAR(100),
    
    -- Payment tracking
    first_payment_due DATE,
    next_payment_due DATE,
    payment_status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_auction_id (auction_id),
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_contract_start_date (contract_start_date),
    INDEX idx_winner_status (winner_status),
    
    FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
    FOREIGN KEY (bid_id) REFERENCES auction_bids(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendor_portal_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 5: Create Auction Watchers Table
-- ============================================


CREATE TABLE IF NOT EXISTS auction_watchers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    auction_id VARCHAR(36) NOT NULL,
    vendor_id VARCHAR(36) NOT NULL,
    
    is_watching BOOLEAN DEFAULT TRUE,
    notify_on_bid BOOLEAN DEFAULT TRUE,
    notify_on_price_change BOOLEAN DEFAULT TRUE,
    notify_on_end BOOLEAN DEFAULT TRUE,
    
    watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_auction_id (auction_id),
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_is_watching (is_watching),
    UNIQUE KEY unique_watcher (auction_id, vendor_id),
    
    FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendor_portal_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 6: Create Auction Audit Trail
-- ============================================


CREATE TABLE IF NOT EXISTS auction_audit_log (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    auction_id VARCHAR(36) NOT NULL,
    
    action_type ENUM(
        'created',           -- Auction created
        'opened',            -- Auction opened to bidding
        'bid_placed',        -- New bid received
        'bid_retracted',     -- Vendor retracted bid
        'outbid_notification', -- Vendor outbid
        'extended',          -- Auction extended
        'closed',            -- Auction ended
        'winner_determined', -- Winner calculated
        'winner_notified',   -- Winner contacted
        'winner_accepted',   -- Winner accepted
        'winner_rejected',   -- Winner declined
        'contract_active',   -- Contract started
        'contract_completed', -- Contract finished
        'cancelled'          -- Auction cancelled
    ) NOT NULL,
    
    performed_by_user_id VARCHAR(36),
    performed_by_user_type ENUM('admin', 'vendor', 'system'),
    
    details JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_auction_id (auction_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 7: Create Views for Reporting
-- ============================================


CREATE OR REPLACE VIEW vw_active_auctions AS
SELECT 
    a.id,
    a.title,
    a.status,
    a.starting_price,
    a.current_price,
    a.auction_end_time,
    TIMESTAMPDIFF(HOUR, NOW(), a.auction_end_time) as hours_remaining,
    a.total_bids,
    a.unique_bidders,
    a.price_increase_percent,
    COUNT(DISTINCT aw.vendor_id) as watchers_count,
    r.votes as visitor_votes,
    r.parent_type_id
FROM auctions a
LEFT JOIN auction_watchers aw ON a.id = aw.auction_id
LEFT JOIN visitor_recommendations r ON a.recommendation_id = r.id
WHERE a.status IN ('open', 'extended')
GROUP BY a.id, a.title, a.status, a.starting_price, a.current_price, 
         a.auction_end_time, a.total_bids, a.unique_bidders, a.price_increase_percent,
         r.votes, r.parent_type_id;

CREATE OR REPLACE VIEW vw_auction_leaderboard AS
SELECT 
    a.id as auction_id,
    a.title,
    ab.vendor_id,
    v.vendor_name,
    ab.bid_amount,
    ab.bid_sequence,
    ab.bid_placed_at,
    ab.is_winning_bid,
    ab.contract_duration_months,
    ab.total_contract_value,
    RANK() OVER (PARTITION BY a.id ORDER BY ab.bid_amount DESC) as bid_rank
FROM auctions a
JOIN auction_bids ab ON a.id = ab.auction_id
JOIN vendor_portal_accounts v ON ab.vendor_id = v.id
WHERE a.status IN ('open', 'extended')
ORDER BY a.id, ab.bid_amount DESC;

CREATE OR REPLACE VIEW vw_vendor_auction_stats AS
SELECT 
    v.id,
    v.vendor_name,
    COUNT(DISTINCT ab.auction_id) as participated_auctions,
    COUNT(DISTINCT CASE WHEN aw.id IS NOT NULL THEN aw.auction_id END) as watching_count,
    COUNT(DISTINCT CASE WHEN aw2.id IS NOT NULL THEN aw2.auction_id END) as won_auctions,
    SUM(CASE WHEN aw2.id IS NOT NULL THEN aw2.total_value ELSE 0 END) as total_won_value,
    AVG(CASE WHEN aw2.id IS NOT NULL THEN aw2.winning_bid_amount ELSE NULL END) as avg_winning_bid,
    COUNT(DISTINCT CASE WHEN ab.is_winning_bid = FALSE THEN ab.auction_id END) as lost_auctions,
    COUNT(DISTINCT CASE WHEN ab.bid_placed_at > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN ab.auction_id END) as auctions_last_30_days
FROM vendor_portal_accounts v
LEFT JOIN auction_bids ab ON v.id = ab.vendor_id
LEFT JOIN auction_watchers aw ON v.id = aw.vendor_id AND aw.is_watching = TRUE
LEFT JOIN auction_winners aw2 ON v.id = aw2.vendor_id
GROUP BY v.id, v.vendor_name;

CREATE OR REPLACE VIEW vw_auction_revenue_report AS
SELECT 
    MONTH(aw.created_at) as month,
    YEAR(aw.created_at) as year,
    COUNT(DISTINCT aw.id) as auctions_completed,
    SUM(aw.total_value) as total_revenue,
    AVG(aw.winning_bid_amount) as avg_winning_bid,
    MAX(aw.winning_bid_amount) as highest_bid,
    MIN(aw.winning_bid_amount) as lowest_bid,
    SUM(aw.winning_bid_amount - a.starting_price) as total_price_increase
FROM auction_winners aw
JOIN auctions a ON aw.auction_id = a.id
WHERE aw.winner_status IN ('won', 'accepted', 'active', 'completed')
GROUP BY YEAR(aw.created_at), MONTH(aw.created_at)
ORDER BY year DESC, month DESC;

-- ============================================
-- STEP 8: Create Stored Procedures
-- ============================================


DELIMITER //

-- Open a new auction
CREATE PROCEDURE IF NOT EXISTS sp_open_auction(
    IN p_recommendation_id VARCHAR(36),
    IN p_title VARCHAR(255),
    IN p_description MEDIUMTEXT,
    IN p_category VARCHAR(100),
    IN p_starting_price DECIMAL(10, 2),
    IN p_reserve_price DECIMAL(10, 2),
    IN p_duration_days INT,
    IN p_admin_id VARCHAR(36)
)
BEGIN
    DECLARE v_auction_id VARCHAR(36);
    DECLARE v_end_time TIMESTAMP;
    
    SET v_auction_id = UUID();
    SET v_end_time = DATE_ADD(NOW(), INTERVAL p_duration_days DAY);
    
    INSERT INTO auctions (
        id, recommendation_id, title, description, category,
        starting_price, current_price, reserve_price,
        auction_start_time, auction_end_time, duration_days,
        status, opened_by_admin_id
    ) VALUES (
        v_auction_id, p_recommendation_id, p_title, p_description, p_category,
        p_starting_price, p_starting_price, p_reserve_price,
        NOW(), v_end_time, p_duration_days,
        'open', p_admin_id
    );
    
    -- Log the action
    INSERT INTO auction_audit_log (
        auction_id, action_type, performed_by_user_id, performed_by_user_type, details
    ) VALUES (
        v_auction_id, 'opened', p_admin_id, 'admin',
        JSON_OBJECT('starting_price', p_starting_price, 'duration_days', p_duration_days)
    );
    
    SELECT v_auction_id as auction_id;
END //

-- Place a bid
CREATE PROCEDURE IF NOT EXISTS sp_place_bid(
    IN p_auction_id VARCHAR(36),
    IN p_vendor_id VARCHAR(36),
    IN p_bid_amount DECIMAL(10, 2),
    IN p_contract_months INT
)
BEGIN
    DECLARE v_bid_id VARCHAR(36);
    DECLARE v_bid_sequence INT;
    DECLARE v_current_winning_bid DECIMAL(10, 2);
    DECLARE v_min_next_bid DECIMAL(10, 2);
    
    -- Get current auction details
    SELECT current_price, total_bids + 1, min_bid_increment
    INTO v_current_winning_bid, v_bid_sequence, v_min_next_bid
    FROM auctions WHERE id = p_auction_id;
    
    SET v_min_next_bid = v_current_winning_bid + v_min_next_bid;
    
    -- Validate bid
    IF p_bid_amount < v_min_next_bid THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bid amount below minimum required';
    END IF;
    
    SET v_bid_id = UUID();
    
    -- Insert the new bid
    INSERT INTO auction_bids (
        id, auction_id, vendor_id, bid_amount, bid_sequence,
        contract_duration_months, is_winning_bid
    ) VALUES (
        v_bid_id, p_auction_id, p_vendor_id, p_bid_amount, v_bid_sequence,
        p_contract_months, TRUE
    );
    
    -- Mark previous highest bid as not winning
    UPDATE auction_bids
    SET is_winning_bid = FALSE, was_outbid = TRUE
    WHERE auction_id = p_auction_id
    AND vendor_id != p_vendor_id
    AND is_winning_bid = TRUE;
    
    -- Update auction current price
    UPDATE auctions
    SET 
        current_price = p_bid_amount,
        total_bids = v_bid_sequence,
        price_increase_percent = ROUND((p_bid_amount - starting_price) / starting_price * 100, 2),
        price_increase_amount = p_bid_amount - starting_price,
        updated_at = NOW()
    WHERE id = p_auction_id;
    
    -- Count unique bidders
    UPDATE auctions
    SET unique_bidders = (
        SELECT COUNT(DISTINCT vendor_id) FROM auction_bids WHERE auction_id = p_auction_id
    )
    WHERE id = p_auction_id;
    
    -- Log the action
    INSERT INTO auction_audit_log (
        auction_id, action_type, performed_by_user_id, performed_by_user_type, details
    ) VALUES (
        p_auction_id, 'bid_placed', p_vendor_id, 'vendor',
        JSON_OBJECT('bid_amount', p_bid_amount, 'bid_sequence', v_bid_sequence)
    );
    
    SELECT v_bid_id as bid_id;
END //

-- Close auction and determine winner
CREATE PROCEDURE IF NOT EXISTS sp_close_auction(
    IN p_auction_id VARCHAR(36)
)
BEGIN
    DECLARE v_winning_bid_id VARCHAR(36);
    DECLARE v_winning_vendor_id VARCHAR(36);
    DECLARE v_winning_amount DECIMAL(10, 2);
    
    -- Get highest bid
    SELECT id, vendor_id, bid_amount
    INTO v_winning_bid_id, v_winning_vendor_id, v_winning_amount
    FROM auction_bids
    WHERE auction_id = p_auction_id
    ORDER BY bid_amount DESC, bid_placed_at ASC
    LIMIT 1;
    
    -- Update auction
    UPDATE auctions
    SET 
        status = 'closed',
        winning_bid_id = v_winning_bid_id,
        winning_vendor_id = v_winning_vendor_id,
        winning_bid_amount = v_winning_amount,
        updated_at = NOW()
    WHERE id = p_auction_id;
    
    -- Log the action
    INSERT INTO auction_audit_log (
        auction_id, action_type, performed_by_user_type, details
    ) VALUES (
        p_auction_id, 'closed', 'system',
        JSON_OBJECT('winning_amount', v_winning_amount, 'winning_vendor_id', v_winning_vendor_id)
    );
END //

-- Complete auction and create winner record
CREATE PROCEDURE IF NOT EXISTS sp_complete_auction(
    IN p_auction_id VARCHAR(36)
)
BEGIN
    DECLARE v_winning_bid_id VARCHAR(36);
    DECLARE v_winning_vendor_id VARCHAR(36);
    DECLARE v_winning_amount DECIMAL(10, 2);
    DECLARE v_contract_months INT;
    DECLARE v_visitor_id VARCHAR(36);
    DECLARE v_visitor_name VARCHAR(255);
    DECLARE v_visitor_email VARCHAR(255);
    DECLARE v_visitor_phone VARCHAR(20);
    DECLARE v_visitor_country VARCHAR(100);
    
    -- Get auction winner details
    SELECT a.winning_bid_id, a.winning_vendor_id, a.winning_bid_amount, a.recommendation_id
    INTO v_winning_bid_id, v_winning_vendor_id, v_winning_amount, v_visitor_id
    FROM auctions a
    WHERE a.id = p_auction_id;
    
    -- Get bid contract duration
    SELECT contract_duration_months
    INTO v_contract_months
    FROM auction_bids
    WHERE id = v_winning_bid_id;
    
    -- Get visitor details from recommendation
    SELECT 
        visitor_id, visitor_name, visitor_email, visitor_phone, visitor_country
    INTO 
        v_visitor_id, v_visitor_name, v_visitor_email, v_visitor_phone, v_visitor_country
    FROM visitor_recommendations
    WHERE id = v_visitor_id;
    
    -- Create winner record
    INSERT INTO auction_winners (
        auction_id, bid_id, vendor_id,
        winning_bid_amount, contract_duration_months,
        total_value,
        contract_start_date, contract_end_date,
        visitor_name, visitor_email, visitor_phone, visitor_country,
        first_payment_due, next_payment_due
    ) VALUES (
        p_auction_id, v_winning_bid_id, v_winning_vendor_id,
        v_winning_amount, v_contract_months,
        v_winning_amount * v_contract_months,
        DATE(NOW()), DATE_ADD(NOW(), INTERVAL v_contract_months MONTH),
        v_visitor_name, v_visitor_email, v_visitor_phone, v_visitor_country,
        DATE_ADD(CURDATE(), INTERVAL 14 DAY), DATE_ADD(CURDATE(), INTERVAL 1 MONTH)
    );
    
    -- Update auction status
    UPDATE auctions
    SET status = 'completed', completed_at = NOW()
    WHERE id = p_auction_id;
    
    -- Log the action
    INSERT INTO auction_audit_log (
        auction_id, action_type, performed_by_user_type
    ) VALUES (
        p_auction_id, 'contract_active', 'system'
    );
END //

DELIMITER ;

-- ============================================
-- STEP 9: Insert Sample Auctions
-- ============================================


-- Sample data will be inserted after migrations are tested

-- ============================================
-- STEP 10: Summary
-- ============================================


-- This migration adds:
-- 1. Auction system for competitive bidding
-- 2. Bid tracking and bid history
-- 3. Winner determination and contracts
-- 4. Vendor watching/notifications
-- 5. Complete audit trail
-- 6. Revenue reporting views
-- 7. Stored procedures for auction operations

-- Key features:
-- ✅ Open auctions for visitor requests
-- ✅ Multiple vendors competing via bidding
-- ✅ Automatic winner determination
-- ✅ Contract creation with payment terms
-- ✅ Revenue maximization through competition
-- ✅ Full audit and compliance tracking
-- ✅ Reporting on auction performance

-- Usage:
-- CALL sp_open_auction('rec_123', 'Cooking Class', '...', 'culinary', 250, 300, 7, 'admin_001');
-- CALL sp_place_bid('auc_001', 'vendor_001', 300, 12);
-- CALL sp_close_auction('auc_001');
-- CALL sp_complete_auction('auc_001');
