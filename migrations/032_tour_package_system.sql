-- ════════════════════════════════════════════════════════════════════
-- Migration: Tour Package System
-- Creates the independent tour product hierarchy separate from
-- business_types. Travel agencies compose packages from businesses.
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────
-- TABLE 1: tour_catalog_categories — The independent tour product tree
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tour_catalog_categories` (
  `id`          VARCHAR(100) PRIMARY KEY,
  `parent_id`   VARCHAR(100) DEFAULT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `name_ar`     VARCHAR(255),
  `description` TEXT,
  `icon`        VARCHAR(100) DEFAULT 'fa-route',
  `color`       VARCHAR(7)   DEFAULT '#0284c7',
  `sort_order`  INT          DEFAULT 0,
  `is_active`   BOOLEAN      DEFAULT TRUE,
  `meta`        JSON,
  `created_at`  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`parent_id`) REFERENCES `tour_catalog_categories`(`id`) ON DELETE SET NULL,
  INDEX `idx_parent`   (`parent_id`),
  INDEX `idx_active`   (`is_active`),
  INDEX `idx_sort`     (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

ALTER TABLE `tour_catalog_categories`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
ALTER TABLE `tour_catalog_categories`
  MODIFY COLUMN `id` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL;
ALTER TABLE `tour_catalog_categories`
  MODIFY COLUMN `parent_id` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL;

-- ────────────────────────────────────────────────────────────────────
-- SEED: tour_catalog_categories (35 rows — the full hierarchy)
-- ────────────────────────────────────────────────────────────────────

-- ROOT NODES (5)
INSERT IGNORE INTO `tour_catalog_categories`
  (`id`, `parent_id`, `name`, `name_ar`, `icon`, `color`, `sort_order`)
VALUES
  ('packages',   NULL, 'Tour Packages',  'باقات سياحية',    'fa-route',       '#0284c7', 1),
  ('tours',      NULL, 'Guided Tours',   'جولات مرشدة',      'fa-map-marked-alt', '#059669', 2),
  ('activities', NULL, 'Activities',     'أنشطة',            'fa-hiking',      '#d97706', 3),
  ('offers',     NULL, 'Special Offers', 'عروض خاصة',        'fa-tags',        '#dc2626', 4),
  ('discounts',  NULL, 'Discounts',      'خصومات',           'fa-percent',     '#7c3aed', 5);

-- PACKAGES children
INSERT IGNORE INTO `tour_catalog_categories`
  (`id`, `parent_id`, `name`, `name_ar`, `icon`, `color`, `sort_order`)
VALUES
  ('multi_day_package',  'packages', 'Multi-Day Package',  'باقة متعددة الأيام', 'fa-calendar-alt', '#0284c7', 1),
  ('day_tour',           'packages', 'Day Tour',            'جولة يومية',         'fa-sun',          '#0284c7', 2),
  ('wellness_retreat',   'multi_day_package', 'Wellness Retreat',   'خلوة صحية',     'fa-spa',          '#059669', 1),
  ('adventure_safari',   'multi_day_package', 'Adventure Safari',   'سفاري مغامرة',  'fa-compass',      '#d97706', 2),
  ('cultural_immersion', 'multi_day_package', 'Cultural Immersion', 'انغماس ثقافي',  'fa-landmark',     '#7c3aed', 3),
  ('culinary_journey',   'multi_day_package', 'Culinary Journey',   'رحلة طهي',      'fa-utensils',     '#f59e0b', 4),
  ('crafts_artisan',     'multi_day_package', 'Crafts & Artisan',   'حرف يدوية',     'fa-palette',      '#ec4899', 5),
  ('custom_bespoke',     'multi_day_package', 'Custom Bespoke',     'مخصص',          'fa-magic',        '#64748b', 6),
  ('half_day',           'day_tour', 'Half Day Tour',   'نصف يوم',    'fa-clock',   '#0284c7', 1),
  ('full_day',           'day_tour', 'Full Day Tour',   'يوم كامل',   'fa-sun',     '#0284c7', 2),
  ('sunset_evening',     'day_tour', 'Sunset & Evening','غروب ومساء', 'fa-moon',    '#7c3aed', 3);

-- TOURS children
INSERT IGNORE INTO `tour_catalog_categories`
  (`id`, `parent_id`, `name`, `name_ar`, `icon`, `color`, `sort_order`)
VALUES
  ('guided_group_tour', 'tours', 'Guided Group Tour',   'جولة جماعية مرشدة', 'fa-users',   '#059669', 1),
  ('private_tour',      'tours', 'Private Guided Tour', 'جولة خاصة مرشدة',   'fa-user',    '#059669', 2),
  ('self_guided',       'tours', 'Self-Guided Tour',    'جولة ذاتية',         'fa-map',     '#059669', 3);

-- ACTIVITIES children
INSERT IGNORE INTO `tour_catalog_categories`
  (`id`, `parent_id`, `name`, `name_ar`, `icon`, `color`, `sort_order`)
VALUES
  ('adventure_activity', 'activities', 'Adventure Activity',  'نشاط مغامرة',  'fa-mountain',      '#d97706', 1),
  ('wellness_activity',  'activities', 'Wellness Activity',   'نشاط صحي',     'fa-spa',           '#d97706', 2),
  ('cultural_activity',  'activities', 'Cultural Activity',   'نشاط ثقافي',   'fa-theater-masks', '#d97706', 3),
  ('visit_activity',     'activities', 'Site Visit',          'زيارة موقع',   'fa-binoculars',    '#d97706', 4),
  ('factory_visit',      'visit_activity', 'Factory Visit',   'زيارة مصنع',   'fa-industry',      '#d97706', 1),
  ('farm_visit',         'visit_activity', 'Farm & Grove Visit','زيارة مزرعة','fa-seedling',      '#d97706', 2),
  ('workshop_visit',     'visit_activity', 'Craft Workshop',  'ورشة حرف يدوية','fa-hammer',       '#d97706', 3),
  ('dining_activity',    'activities', 'Dining Experience',   'تجربة طعام',   'fa-utensils',      '#d97706', 5);

-- OFFERS children
INSERT IGNORE INTO `tour_catalog_categories`
  (`id`, `parent_id`, `name`, `name_ar`, `icon`, `color`, `sort_order`)
VALUES
  ('seasonal_offer',   'offers', 'Seasonal Offer',  'عرض موسمي',       'fa-calendar',    '#dc2626', 1),
  ('group_offer',      'offers', 'Group Offer',      'عرض مجموعة',      'fa-users',       '#dc2626', 2),
  ('early_bird_offer', 'offers', 'Early Bird',       'حجز مبكر',        'fa-clock',       '#dc2626', 3),
  ('last_minute_offer','offers', 'Last Minute',      'اللحظة الأخيرة',  'fa-bolt',        '#dc2626', 4),
  ('combo_offer',      'offers', 'Combo Bundle',     'باقة مجمعة',      'fa-layer-group', '#dc2626', 5);

-- DISCOUNTS children
INSERT IGNORE INTO `tour_catalog_categories`
  (`id`, `parent_id`, `name`, `name_ar`, `icon`, `color`, `sort_order`)
VALUES
  ('loyalty_discount',  'discounts', 'Loyalty Discount', 'خصم الولاء',    'fa-heart',   '#7c3aed', 1),
  ('promo_discount',    'discounts', 'Promo Code',        'كود خصم',       'fa-ticket',  '#7c3aed', 2),
  ('referral_discount', 'discounts', 'Referral Reward',   'مكافأة الإحالة','fa-share',   '#7c3aed', 3),
  ('flash_discount',    'discounts', 'Flash Sale',        'تخفيض مؤقت',    'fa-fire',    '#7c3aed', 4);


-- ────────────────────────────────────────────────────────────────────
/* Existing TiDB deployment already contains the tour product tables. Their
  original CREATE TABLE blocks are retained for documentation but skipped
  during additive synchronization.

-- TABLE 2: tour_products — The product catalog
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tour_products` (
  `id`                  VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  `catalog_cat_id`      VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `vendor_business_id`  VARCHAR(36)   DEFAULT NULL  COMMENT 'FK businesses.id — travel agency that owns this package',
  `vendor_name`         VARCHAR(255)  DEFAULT NULL,
  `name`                VARCHAR(255)  NOT NULL,
  `name_ar`             VARCHAR(255),
  `slug`                VARCHAR(255)  UNIQUE,
  `description`         TEXT,
  `description_ar`      TEXT,
  `duration_days`       INT           DEFAULT 1,
  `duration_hours`      DECIMAL(4,1)  DEFAULT NULL,
  `difficulty`          ENUM('easy','moderate','challenging') DEFAULT 'easy',
  `pace`                ENUM('slow','moderate','active')      DEFAULT 'moderate',
  `group_size_min`      INT           DEFAULT 1,
  `group_size_max`      INT           DEFAULT 20,
  `base_price_usd`      DECIMAL(10,2) DEFAULT NULL,
  `base_price_egp`      DECIMAL(10,2) DEFAULT NULL,
  `price_per`           ENUM('person','group','fixed')        DEFAULT 'person',
  `included`            JSON,
  `excluded`            JSON,
  `highlights`          JSON,
  `best_season`         VARCHAR(100),
  `tags`                JSON,
  `image_url`           VARCHAR(500),
  `gallery`             JSON,
  `is_public`           BOOLEAN       DEFAULT TRUE,
  `is_featured`         BOOLEAN       DEFAULT FALSE,
  `is_active`           BOOLEAN       DEFAULT TRUE,
  `view_count`          INT           DEFAULT 0,
  `booking_count`       INT           DEFAULT 0,
  `created_by`          VARCHAR(36)   DEFAULT NULL,
  `source_template_id`  VARCHAR(50)   DEFAULT NULL  COMMENT 'journey_templates.id if migrated',
  `created_at`          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`catalog_cat_id`) REFERENCES `tour_catalog_categories`(`id`),
  INDEX `idx_vendor`    (`vendor_business_id`),
  INDEX `idx_cat`       (`catalog_cat_id`),
  INDEX `idx_featured`  (`is_featured`),
  INDEX `idx_active`    (`is_active`),
  INDEX `idx_slug`      (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


-- ────────────────────────────────────────────────────────────────────
-- TABLE 3: tour_stops — Bridge: businesses → tour products
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tour_stops` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `product_id`     VARCHAR(36)  NOT NULL,
  `business_id`    VARCHAR(36)  NOT NULL,
  `stop_role`      ENUM('stay','eat','visit','do','travel','buy') NOT NULL,
  `day_number`     INT          DEFAULT 1,
  `time_slot`      ENUM('morning','afternoon','evening','full_day','overnight') DEFAULT 'morning',
  `sequence_order` INT          DEFAULT 0,
  `duration_hours` DECIMAL(4,1) DEFAULT NULL,
  `notes`          TEXT,
  `is_optional`    BOOLEAN      DEFAULT FALSE,
  `price_usd`      DECIMAL(10,2) DEFAULT NULL,
  `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`)  REFERENCES `tour_products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`)    ON DELETE CASCADE,
  INDEX `idx_product`  (`product_id`),
  INDEX `idx_business` (`business_id`),
  INDEX `idx_day`      (`day_number`),
  INDEX `idx_role`     (`stop_role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


-- ────────────────────────────────────────────────────────────────────
-- TABLE 4: tour_promotions — Offers & Discounts
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tour_promotions` (
  `id`              VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  `catalog_cat_id`  VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id`      VARCHAR(36)   DEFAULT NULL  COMMENT 'NULL = applies to all products',
  `vendor_business_id` VARCHAR(36) DEFAULT NULL COMMENT 'NULL = platform-wide offer',
  `name`            VARCHAR(255)  NOT NULL,
  `name_ar`         VARCHAR(255),
  `promo_code`      VARCHAR(50)   DEFAULT NULL,
  `discount_type`   ENUM('percent','fixed_usd','fixed_egp') DEFAULT 'percent',
  `discount_value`  DECIMAL(10,2) NOT NULL,
  `min_group_size`  INT           DEFAULT 1,
  `min_days`        INT           DEFAULT 1,
  `valid_from`      DATE          DEFAULT NULL,
  `valid_until`     DATE          DEFAULT NULL,
  `max_uses`        INT           DEFAULT NULL,
  `used_count`      INT           DEFAULT 0,
  `is_active`       BOOLEAN       DEFAULT TRUE,
  `conditions`      JSON,
  `created_at`      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`catalog_cat_id`) REFERENCES `tour_catalog_categories`(`id`),
  FOREIGN KEY (`product_id`)     REFERENCES `tour_products`(`id`)         ON DELETE CASCADE,
  INDEX `idx_product`    (`product_id`),
  INDEX `idx_vendor`     (`vendor_business_id`),
  INDEX `idx_promo_code` (`promo_code`),
  INDEX `idx_active`     (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


-- ────────────────────────────────────────────────────────────────────
*/

-- STEP 4: Upgrade travel_agency business type to all 10 sections
-- ────────────────────────────────────────────────────────────────────
UPDATE `business_types`
SET
  `sections` = JSON_ARRAY(
    'sec_1_identity','sec_2_ambience','sec_3_facilities',
    'sec_4_gastronomy','sec_5_experiences','sec_6_guardian',
    'sec_7_investment','sec_8_connector',
    'sec_9_marketplace_catalog','sec_10_testimonials_faqs'
  ),
  `own_sections` = JSON_ARRAY(
    'sec_1_identity','sec_2_ambience','sec_3_facilities',
    'sec_4_gastronomy','sec_5_experiences','sec_6_guardian',
    'sec_7_investment','sec_8_connector',
    'sec_9_marketplace_catalog','sec_10_testimonials_faqs'
  ),
  `blueprint_schema` = JSON_OBJECT(
    'chapters', JSON_OBJECT(
      'identity', JSON_OBJECT(
        'layer1', JSON_ARRAY('description','trade_license','founded_year','website','email','social_links'),
        'layer2', JSON_ARRAY()
      ),
      'fleet', JSON_OBJECT(
        'layer1', JSON_ARRAY('vehicle_types','vehicle_count','ac','4wd'),
        'layer2', JSON_ARRAY('vehicle_photos')
      ),
      'guides', JSON_OBJECT(
        'layer1', JSON_ARRAY('guide_count','languages','certifications'),
        'layer2', JSON_ARRAY('guide_profiles')
      ),
      'offers', JSON_OBJECT(
        'layer1', JSON_ARRAY('discount_pct','group_rates','agent_commission_pct'),
        'layer2', JSON_ARRAY('promo_code','offer_expires')
      ),
      'trust', JSON_OBJECT(
        'layer1', JSON_ARRAY('license_number','insurance','safety_rating'),
        'layer2', JSON_ARRAY('certifications')
      ),
      'programs', JSON_OBJECT(
        'layer1', JSON_ARRAY('booking_required','advance_notice_days','cancellation_policy'),
        'layer2', JSON_ARRAY()
      )
    )
  )
WHERE `id` = 'travel_agency';


-- ────────────────────────────────────────────────────────────────────
-- STEP 5: Migrate existing journey_templates → tour_products
-- ────────────────────────────────────────────────────────────────────
INSERT IGNORE INTO `tour_products`
  (`catalog_cat_id`, `name`, `slug`, `description`, `duration_days`,
   `difficulty`, `group_size_max`, `base_price_usd`, `best_season`,
   `highlights`, `included`, `is_public`, `is_featured`, `source_template_id`)
SELECT
  CASE id
    WHEN 'wellness-retreat'    THEN 'wellness_retreat'
    WHEN 'culinary-journey'    THEN 'culinary_journey'
    WHEN 'artisan-deep-dive'   THEN 'crafts_artisan'
    WHEN 'adventure-safari'    THEN 'adventure_safari'
    WHEN 'cultural-immersion'  THEN 'cultural_immersion'
    ELSE 'multi_day_package'
  END                                                AS catalog_cat_id,
  `name`,
  LOWER(REPLACE(`id`, '-', '_'))                     AS slug,
  `description`,
  `duration_days`,
  `difficulty_level`                                 AS difficulty,
  `max_group_size`                                   AS group_size_max,
  `estimated_cost_usd_min`                           AS base_price_usd,
  `best_season`,
  `highlights`,
  JSON_ARRAY('Guide', 'Transport', 'Entrance Fees')  AS included,
  1                                                  AS is_public,
  `is_featured`,
  `id`                                               AS source_template_id
FROM `journey_templates`
WHERE `is_visible` = 1;

-- ════════════════════════════════════════════════════════════════════
-- DONE
-- ✓ tour_catalog_categories  — 35 rows seeded (packages/tours/activities/offers/discounts)
-- ✓ tour_products             — product catalog with vendor ownership
-- ✓ tour_stops                — bridge: businesses → packages (with stop_role)
-- ✓ tour_promotions           — offers and discounts
-- ✓ travel_agency             — upgraded to all 10 sections + blueprint
-- ✓ journey_templates         — migrated into tour_products
-- ════════════════════════════════════════════════════════════════════
