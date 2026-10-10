ALTER TABLE vendor_service_template_fields
  ADD COLUMN applies_to JSON NULL AFTER validation;

ALTER TABLE vendor_service_template_fields
  ADD COLUMN publicly_visible BOOLEAN NOT NULL DEFAULT TRUE AFTER applies_to;

INSERT INTO vendor_service_templates (id, category, label, description, active)
VALUES (
  'transportation_standard',
  'transportation',
  'Transportation service',
  'Vehicles, aircraft, drivers, routes, and transport services.',
  TRUE
)
ON DUPLICATE KEY UPDATE
  category = VALUES(category),
  label = VALUES(label),
  description = VALUES(description),
  active = TRUE;

UPDATE vendor_service_template_fields
SET active = FALSE
WHERE template_id = 'transportation_standard'
  AND name IN ('vehicle_type', 'route', 'passenger_capacity', 'driver_languages');

UPDATE vendor_service_template_fields
SET publicly_visible = FALSE
WHERE template_id = 'transportation_standard'
  AND name IN ('registration_number', 'operating_license', 'driver_license_details', 'pilot_license_details',
               'insurance_provider', 'insurance_expiry', 'inspection_expiry');

INSERT INTO vendor_service_template_fields
  (id, template_id, name, label, field_type, required, options, validation, applies_to, publicly_visible, display_order)
VALUES
  ('transport_vehicle_type', 'transportation_standard', 'vehicle_type', 'Transportation type', 'select', TRUE,
   JSON_ARRAY('minibus', 'helicopter', 'car_taxi', '4x4', 'tuk_tuk', 'boat', 'freight', 'bicycle_scooter'),
   JSON_OBJECT(), NULL, TRUE, 10),
  ('transport_make', 'transportation_standard', 'vehicle_make', 'Vehicle / aircraft make', 'text', FALSE,
   NULL, JSON_OBJECT(), NULL, TRUE, 20),
  ('transport_model', 'transportation_standard', 'vehicle_model', 'Model or vessel name', 'text', FALSE,
   NULL, JSON_OBJECT(), NULL, TRUE, 30),
  ('transport_year', 'transportation_standard', 'vehicle_year', 'Model year', 'number', FALSE,
   NULL, JSON_OBJECT(), NULL, TRUE, 40),
  ('transport_registration', 'transportation_standard', 'registration_number', 'Registration / tail number', 'text', FALSE,
   NULL, JSON_OBJECT(), NULL, FALSE, 50),
  ('transport_capacity', 'transportation_standard', 'passenger_capacity', 'Passenger capacity', 'number', TRUE,
   NULL, JSON_OBJECT(), NULL, TRUE, 60),
  ('transport_luggage', 'transportation_standard', 'luggage_capacity', 'Luggage capacity', 'text', FALSE,
   NULL, JSON_OBJECT(), JSON_OBJECT('field', 'vehicle_type', 'values', JSON_ARRAY('minibus', 'car_taxi', '4x4', 'tuk_tuk', 'bicycle_scooter')), TRUE, 70),
  ('transport_cargo', 'transportation_standard', 'cargo_capacity', 'Cargo capacity', 'text', FALSE,
   NULL, JSON_OBJECT(), JSON_OBJECT('field', 'vehicle_type', 'values', JSON_ARRAY('freight')), TRUE, 80),
  ('transport_range', 'transportation_standard', 'flight_range', 'Flight range', 'text', FALSE,
   NULL, JSON_OBJECT(), JSON_OBJECT('field', 'vehicle_type', 'values', JSON_ARRAY('helicopter')), TRUE, 90),
  ('transport_route', 'transportation_standard', 'route', 'Route / coverage', 'textarea', TRUE,
   NULL, JSON_OBJECT(), NULL, TRUE, 100),
  ('transport_service_area', 'transportation_standard', 'service_area', 'Service area', 'textarea', FALSE,
   NULL, JSON_OBJECT(), NULL, TRUE, 110),
  ('transport_pickup', 'transportation_standard', 'pickup_options', 'Pickup / boarding arrangements', 'textarea', FALSE,
   NULL, JSON_OBJECT(), NULL, TRUE, 120),
  ('transport_schedule', 'transportation_standard', 'schedule', 'Schedule / operating times', 'textarea', FALSE,
   NULL, JSON_OBJECT(), NULL, TRUE, 130),
  ('transport_inclusions', 'transportation_standard', 'included_service', 'What is included', 'textarea', FALSE,
   NULL, JSON_OBJECT(), NULL, TRUE, 140),
  ('transport_features', 'transportation_standard', 'vehicle_features', 'Vehicle features', 'multiselect', FALSE,
   JSON_ARRAY('Air conditioning', 'Seat belts', 'Child seats', 'Accessibility support', 'Wi-Fi', 'Safety equipment'),
   JSON_OBJECT(), JSON_OBJECT('field', 'vehicle_type', 'values', JSON_ARRAY('minibus', 'car_taxi', '4x4', 'tuk_tuk', 'boat', 'bicycle_scooter')), TRUE, 150),
  ('transport_license', 'transportation_standard', 'operating_license', 'Operating license / permit', 'text', FALSE,
   NULL, JSON_OBJECT(), JSON_OBJECT('field', 'vehicle_type', 'values', JSON_ARRAY('helicopter', 'boat', 'freight')), FALSE, 160),
  ('transport_driver_license', 'transportation_standard', 'driver_license_details', 'Driver license details', 'text', FALSE,
   NULL, JSON_OBJECT(), JSON_OBJECT('field', 'vehicle_type', 'values', JSON_ARRAY('minibus', 'car_taxi', '4x4', 'tuk_tuk', 'freight')), FALSE, 165),
  ('transport_pilot_license', 'transportation_standard', 'pilot_license_details', 'Pilot license details', 'text', TRUE,
   NULL, JSON_OBJECT(), JSON_OBJECT('field', 'vehicle_type', 'values', JSON_ARRAY('helicopter')), FALSE, 166),
  ('transport_insurance', 'transportation_standard', 'insurance_provider', 'Insurance provider / policy', 'text', FALSE,
   NULL, JSON_OBJECT(), NULL, FALSE, 170),
  ('transport_insurance_expiry', 'transportation_standard', 'insurance_expiry', 'Insurance expiry date', 'date', FALSE,
   NULL, JSON_OBJECT(), NULL, FALSE, 175),
  ('transport_inspection_expiry', 'transportation_standard', 'inspection_expiry', 'Inspection expiry date', 'date', FALSE,
   NULL, JSON_OBJECT(), NULL, FALSE, 180),
  ('transport_safety', 'transportation_standard', 'safety_information', 'Safety and inspection details', 'textarea', FALSE,
   NULL, JSON_OBJECT(), NULL, TRUE, 185),
  ('transport_languages', 'transportation_standard', 'operator_languages', 'Driver / pilot languages', 'multiselect', FALSE,
   JSON_ARRAY('Arabic', 'English', 'French', 'Italian'), JSON_OBJECT(), NULL, TRUE, 190),
  ('transport_duration', 'transportation_standard', 'service_duration', 'Typical service duration', 'text', FALSE,
   NULL, JSON_OBJECT(), NULL, TRUE, 200),
  ('transport_booking_notice', 'transportation_standard', 'booking_notice', 'Advance booking notice', 'text', FALSE,
   NULL, JSON_OBJECT(), NULL, TRUE, 210),
  ('transport_cancellation', 'transportation_standard', 'cancellation_policy', 'Cancellation / waiting policy', 'textarea', FALSE,
   NULL, JSON_OBJECT(), NULL, TRUE, 220),
  ('transport_photo', 'transportation_standard', 'vehicle_photo_url', 'Vehicle / aircraft photo URL', 'url', FALSE,
   NULL, JSON_OBJECT(), NULL, TRUE, 230)
ON DUPLICATE KEY UPDATE
  label = VALUES(label),
  field_type = VALUES(field_type),
  required = VALUES(required),
  options = VALUES(options),
  validation = VALUES(validation),
  applies_to = VALUES(applies_to),
  publicly_visible = VALUES(publicly_visible),
  display_order = VALUES(display_order),
  active = TRUE;
