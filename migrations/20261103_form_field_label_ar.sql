-- Arabic labels for the fields a vendor is asked to fill.
--
-- Every other reader-facing string already had an Arabic twin: sections had
-- name_ar (20261031), typologies and business names had theirs long before.
-- form_fields did not, which left the Arabic page printing English questions:
-- the vendor's form, the field caption above a saved answer, and the label in a
-- comparison table all come from form_fields.label.
--
-- Nullable and never defaulted: an absent label_ar means "this field was written
-- in English only", and the reader falls back to `label`.

ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS label_ar VARCHAR(191) DEFAULT NULL AFTER label;
