-- ============================================================
-- SIWA OASIS: MASTER CLOUD SCHEMA
-- Includes Three-Axis Architecture: Locations, Types, Policies
-- ============================================================

-- 1. PROFILES (Extends Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'vendor' CHECK (role IN ('super_admin','content_admin','sales_manager','support_agent','salesman','vendor')),
  display_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. AXIS 1: LOCATIONS (Geography Engine)
CREATE TABLE locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('country', 'governorate', 'city', 'town', 'neighborhood')),
  parent_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
  slug TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  sort_order NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. AXIS 2: BUSINESS TYPES (Typology Engine)
CREATE TABLE business_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'fas fa-building',
  icon_color TEXT DEFAULT '#8b5cf6',
  description TEXT,
  is_parent BOOLEAN DEFAULT false,
  parent_id TEXT REFERENCES business_types(id) ON DELETE SET NULL,
  sections TEXT[] DEFAULT '{}',
  own_sections TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  sort_order NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT check_strict_hierarchy CHECK (
    (is_parent = true AND parent_id IS NULL) OR 
    (is_parent = false AND parent_id IS NOT NULL)
  )
);

-- 4. SECTIONS & FORM FIELDS
CREATE TABLE sections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'fa-info-circle',
  required BOOLEAN DEFAULT false,
  vendor_editable BOOLEAN DEFAULT true,
  show_on_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type_id TEXT NOT NULL REFERENCES business_types(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL,
  required BOOLEAN DEFAULT false,
  searchable BOOLEAN DEFAULT false,
  help_text TEXT,
  options TEXT[],
  validation JSONB DEFAULT '{}',
  permissions JSONB DEFAULT '{"showOnPublic": true}',
  default_value TEXT,
  sort_order NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_type_id, section_id, name)
);

CREATE TABLE custom_expressions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'select',
  options TEXT[] DEFAULT '{}',
  searchable BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. AXIS 3: COMPONENT POLICIES & TIERS 
CREATE TABLE service_components (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'fa-cube',
  category TEXT DEFAULT 'general',
  configurable_options JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  active BOOLEAN DEFAULT true,
  sort_order NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE subscription_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_amount NUMERIC DEFAULT 0,
  price_currency TEXT DEFAULT 'USD',
  price_period TEXT DEFAULT 'month',
  version INTEGER DEFAULT 1,
  components JSONB NOT NULL DEFAULT '{}',
  features JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tier_policy_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id TEXT NOT NULL REFERENCES subscription_tiers(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  components JSONB NOT NULL,
  change_note TEXT,
  saved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE search_policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  role TEXT NOT NULL,
  allowed_fields TEXT[] NOT NULL DEFAULT '{name,description}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. BUSINESSES (The Intersection Point)
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type_id TEXT NOT NULL REFERENCES business_types(id),
  location_id TEXT REFERENCES locations(id),
  owner_id UUID REFERENCES profiles(id),
  subscription_tier TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','hidden','pending')),
  published BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  custom_data JSONB DEFAULT '{}',
  contact JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. MINISITES (Component-driven pages)
CREATE TABLE minisite_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Home',
  slug TEXT NOT NULL DEFAULT 'home',
  components JSONB[] DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  published BOOLEAN DEFAULT false,
  sort_order NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, slug)
);

-- 8. UPGRADE REQUESTS & ACTIVITY LOG
CREATE TABLE upgrade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES profiles(id),
  client_name TEXT,
  requested_tier TEXT NOT NULL,
  requested_features JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  details TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','content_admin','sales_manager')));

-- Businesses
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published" ON businesses FOR SELECT USING (published = true AND status = 'active');
CREATE POLICY "Owner edit own" ON businesses FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Admins manage all" ON businesses FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','content_admin','sales_manager')));

-- Minisites
ALTER TABLE minisite_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published pages" ON minisite_pages FOR SELECT USING (published = true);
CREATE POLICY "Business Owner manage own pages" ON minisite_pages FOR ALL USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = minisite_pages.business_id AND businesses.owner_id = auth.uid()));

-- Global Taxonomies (Read-Only for Public, Admin-Only for Edit)
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read locations" ON locations FOR SELECT USING (true);
CREATE POLICY "Admins manage locations" ON locations FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','content_admin')));

ALTER TABLE business_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read business_types" ON business_types FOR SELECT USING (true);
CREATE POLICY "Admins manage business_types" ON business_types FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','content_admin')));
