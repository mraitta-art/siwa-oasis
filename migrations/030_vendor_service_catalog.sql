-- Shared vendor service catalog for agencies, accommodation providers,
-- transportation companies, restaurants, guides, and activity providers.

INSERT INTO component_templates
  (id, name, icon, description, category, fields, example_data)
VALUES
  (
    'service_catalog',
    'Service Catalog Item',
    'fa-layer-group',
    'A bookable service, facility, room, vehicle, activity, or package offered by the vendor.',
    'Marketplace',
    '[
      {"name":"category","type":"select","label":"Service Category","required":true,"options":["Transportation","Accommodation","Tours & Activities","Food & Dining","Guides","Packages","Facilities","Other"]},
      {"name":"title","type":"text","label":"Service Name","required":true},
      {"name":"description","type":"textarea","label":"Description","required":true},
      {"name":"price","type":"number","label":"Starting Price"},
      {"name":"currency","type":"text","label":"Currency","default":"EGP"},
      {"name":"price_unit","type":"select","label":"Price Unit","options":["per person","per night","per vehicle","per room","per booking","from price"]},
      {"name":"duration","type":"text","label":"Duration"},
      {"name":"capacity","type":"text","label":"Capacity"},
      {"name":"availability","type":"text","label":"Availability"},
      {"name":"image","type":"image","label":"Image"},
      {"name":"request_url","type":"text","label":"Request Link"}
    ]',
    '{"category":"Tours & Activities","title":"Salt Lakes Experience","description":"A guided half-day experience in Siwa Oasis.","price":750,"currency":"EGP","price_unit":"per person","duration":"4 hours","capacity":"2-12 guests","availability":"Daily"}'
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  icon = VALUES(icon),
  description = VALUES(description),
  category = VALUES(category),
  fields = VALUES(fields),
  example_data = VALUES(example_data);

INSERT INTO section_components
  (id, section_id, component_type, label, description, is_required, is_repeatable, max_items, display_order, config)
SELECT
  UUID(),
  'sec_9_marketplace_catalog',
  'service_catalog',
  'Services & Facilities',
  'Add every service your business provides. These items can be displayed on your profile and marketplace pages.',
  FALSE,
  TRUE,
  100,
  10,
  JSON_OBJECT(
    'fields', JSON_ARRAY(
      JSON_OBJECT('name','category','type','select','label','Service Category','required',TRUE,'options',JSON_ARRAY('Transportation','Accommodation','Tours & Activities','Food & Dining','Guides','Packages','Facilities','Other')),
      JSON_OBJECT('name','title','type','text','label','Service Name','required',TRUE),
      JSON_OBJECT('name','description','type','textarea','label','Description','required',TRUE),
      JSON_OBJECT('name','price','type','number','label','Starting Price'),
      JSON_OBJECT('name','currency','type','text','label','Currency','default','EGP'),
      JSON_OBJECT('name','price_unit','type','select','label','Price Unit','options',JSON_ARRAY('per person','per night','per vehicle','per room','per booking','from price')),
      JSON_OBJECT('name','duration','type','text','label','Duration'),
      JSON_OBJECT('name','capacity','type','text','label','Capacity'),
      JSON_OBJECT('name','availability','type','text','label','Availability'),
      JSON_OBJECT('name','image','type','image','label','Image'),
      JSON_OBJECT('name','request_url','type','text','label','Request Link')
    )
  )
FROM sections
WHERE id = 'sec_9_marketplace_catalog'
  AND NOT EXISTS (
    SELECT 1 FROM section_components
    WHERE section_id = 'sec_9_marketplace_catalog'
      AND component_type = 'service_catalog'
  );