ALTER TABLE form_fields
  ADD COLUMN IF NOT EXISTS field_scope VARCHAR(30) NOT NULL DEFAULT 'profile',
  ADD COLUMN IF NOT EXISTS applies_to JSON NULL;

UPDATE form_fields
SET field_scope = 'profile'
WHERE field_scope IS NULL OR field_scope = '';

INSERT IGNORE INTO form_fields (
  id, business_type_id, section_id, name, label, field_type, required,
  vendor_editable, searchable, help_text, options, validation, acl,
  sort_order, section_origin, field_scope, applies_to
)
SELECT
  UUID(), seed.business_type_id, 'sec_9_marketplace_catalog', seed.name, seed.label,
  seed.field_type, 0, 1, 1, seed.help_text, seed.options, JSON_OBJECT(),
  JSON_OBJECT('read', JSON_ARRAY('super_admin', 'content_admin', 'vendor', 'public'),
              'write', JSON_ARRAY('super_admin', 'content_admin', 'vendor')),
  seed.sort_order, 'own', 'catalog_spec', seed.applies_to
FROM (
  SELECT 'accommodation' AS business_type_id, 'room_type' AS name, 'Room type' AS label, 'select' AS field_type, 'Room or unit category.' AS help_text, JSON_ARRAY('Standard', 'Deluxe', 'Suite', 'Family', 'Apartment', 'Villa', 'Camp') AS options, JSON_ARRAY('room', 'room_bundle', 'package') AS applies_to, 10 AS sort_order
  UNION ALL SELECT 'accommodation', 'maximum_occupancy', 'Maximum occupancy', 'number', 'Maximum guests for this room or unit.', NULL, JSON_ARRAY('room', 'room_bundle', 'package'), 20
  UNION ALL SELECT 'accommodation', 'bed_configuration', 'Bed configuration', 'text', 'Bed count and configuration.', NULL, JSON_ARRAY('room', 'room_bundle', 'package'), 30
  UNION ALL SELECT 'accommodation', 'minimum_nights', 'Minimum nights', 'number', 'Minimum stay for this room or offer.', NULL, JSON_ARRAY('room', 'room_bundle', 'package'), 40
  UNION ALL SELECT 'logistics', 'service_kind', 'Transport service kind', 'select', 'Transfer, route, rental, delivery, or guided transport.', JSON_ARRAY('transfer', 'route', 'rental', 'delivery', 'guided'), JSON_ARRAY('transport_service', 'package', 'tour'), 10
  UNION ALL SELECT 'logistics', 'route_name', 'Route or service area', 'text', 'Named route or service area.', NULL, JSON_ARRAY('transport_service', 'package', 'tour'), 20
  UNION ALL SELECT 'logistics', 'pickup_point', 'Pickup point', 'text', 'Pickup or meeting point for this service.', NULL, JSON_ARRAY('transport_service', 'package', 'tour'), 30
  UNION ALL SELECT 'logistics', 'vehicle_class', 'Vehicle class', 'select', 'Vehicle class used for the service.', JSON_ARRAY('Car / Taxi', 'Minibus', '4x4', 'Tuk-tuk', 'Bicycle / Scooter'), JSON_ARRAY('transport_service', 'package', 'tour'), 40
  UNION ALL SELECT 'logistics', 'passenger_capacity', 'Passenger capacity', 'number', 'Maximum passengers for this service.', NULL, JSON_ARRAY('transport_service', 'package', 'tour'), 50
  UNION ALL SELECT 'adventure', 'difficulty', 'Difficulty', 'select', 'Physical or technical difficulty level.', JSON_ARRAY('Easy', 'Moderate', 'Challenging'), JSON_ARRAY('activity', 'tour', 'package', 'retreat'), 10
  UNION ALL SELECT 'adventure', 'duration_hours', 'Duration in hours', 'number', 'Expected duration for this departure or activity.', NULL, JSON_ARRAY('activity', 'tour', 'package', 'retreat'), 20
  UNION ALL SELECT 'adventure', 'group_capacity', 'Group capacity', 'number', 'Maximum participants per departure.', NULL, JSON_ARRAY('activity', 'tour', 'package', 'retreat'), 30
  UNION ALL SELECT 'adventure', 'guide_languages', 'Guide languages', 'multiselect', 'Languages offered by the guide.', JSON_ARRAY('Arabic', 'English', 'French', 'German'), JSON_ARRAY('activity', 'tour', 'package', 'retreat'), 40
  UNION ALL SELECT 'food', 'menu_category', 'Menu category', 'select', 'Menu category or course.', JSON_ARRAY('Breakfast', 'Starter', 'Main', 'Dessert', 'Drink', 'Combo'), JSON_ARRAY('menu_item', 'package'), 10
  UNION ALL SELECT 'food', 'serving_size', 'Serving size or variant', 'text', 'Portion size or menu variant.', NULL, JSON_ARRAY('menu_item', 'package'), 20
  UNION ALL SELECT 'food', 'dietary_tags', 'Dietary tags', 'multiselect', 'Dietary suitability for this item.', JSON_ARRAY('Halal', 'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free'), JSON_ARRAY('menu_item', 'package'), 30
  UNION ALL SELECT 'crafts', 'sku', 'SKU', 'text', 'Business product identifier.', NULL, JSON_ARRAY('product', 'package'), 10
  UNION ALL SELECT 'crafts', 'material', 'Material or ingredients', 'text', 'Primary material or ingredients.', NULL, JSON_ARRAY('product', 'package'), 20
  UNION ALL SELECT 'crafts', 'product_variants', 'Variants', 'multiselect', 'Available sizes, colors, patterns, or pack options.', JSON_ARRAY('Small', 'Medium', 'Large', 'Custom'), JSON_ARRAY('product', 'package'), 30
  UNION ALL SELECT 'crafts', 'stock_quantity', 'Stock quantity', 'number', 'Available units; keep this current before publishing.', NULL, JSON_ARRAY('product'), 40
  UNION ALL SELECT 'production_trade', 'product_grade', 'Product grade or variety', 'text', 'Grade, variety, or specification.', NULL, JSON_ARRAY('trade_product', 'product', 'package'), 10
  UNION ALL SELECT 'production_trade', 'pack_size', 'Pack size', 'text', 'Weight, volume, or units per pack.', NULL, JSON_ARRAY('trade_product', 'product', 'package'), 20
  UNION ALL SELECT 'production_trade', 'minimum_order_quantity', 'Minimum order quantity', 'number', 'Minimum units per wholesale order.', NULL, JSON_ARRAY('trade_product', 'product'), 30
  UNION ALL SELECT 'production_trade', 'lead_time_days', 'Lead time in days', 'number', 'Typical time to prepare or fulfill an order.', NULL, JSON_ARRAY('trade_product', 'product'), 40
  UNION ALL SELECT 'production_trade', 'visit_capacity', 'Factory visit capacity', 'number', 'Maximum visitors per factory visit.', NULL, JSON_ARRAY('factory_visit'), 50
  UNION ALL SELECT 'production_trade', 'visit_duration_minutes', 'Factory visit duration', 'number', 'Expected visit duration in minutes.', NULL, JSON_ARRAY('factory_visit'), 60
) AS seed
JOIN business_types bt ON bt.id = seed.business_type_id
JOIN sections section_record ON section_record.id = 'sec_9_marketplace_catalog';