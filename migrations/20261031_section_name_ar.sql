-- Arabic display name for a section.
--
-- `sections.name` is what a visitor reads in the minisite tab bar, and it was
-- English-only: an /ar minisite printed Arabic copy underneath English tabs.
-- A section is shared by every typology that uses it, so the Arabic label
-- belongs on the section. The per-business override in
-- businesses.custom_data.section_labels_ar keeps working and still wins.
--
-- Re-running this file is a no-op: the ADD only happens once.
ALTER TABLE sections
  ADD COLUMN IF NOT EXISTS name_ar VARCHAR(191) NULL
    COMMENT 'Arabic tab label; NULL means fall back to name';

-- Verify:
--   SELECT id, name, name_ar FROM sections ORDER BY sort_order;
