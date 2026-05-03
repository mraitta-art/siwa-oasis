// ================================================================
// SIWA OASIS: TypeScript Interfaces for Governance Data Model
// ================================================================

export interface BusinessType {
  id: string;
  name: string;
  icon: string;
  icon_color: string;
  description: string;
  is_parent: boolean;
  parent_id: string | null;
  sections: string[];
  own_sections: string[];
  active: boolean;
  sort_order: number;
}

export interface Section {
  id: string;
  name: string;
  icon: string;
  required: boolean;
  vendor_editable: boolean;
  show_on_public?: boolean;
  is_filterable?: boolean;
  show_on_card?: boolean;
  is_universal?: boolean;
  options?: string[];
  section_type?: 'general' | 'additional' | 'universal';
  description?: string;
  inheritance_rules?: any;
  display_order?: number;
  is_searchable?: boolean;
}

export interface GovernanceField {
  id: string;
  name: string;
  label: string;
  field_type: string;
  section_id: string;
  required: boolean;
  vendor_editable?: boolean;
  is_admin_only?: boolean;
  is_filterable?: boolean;
  show_on_card?: boolean;
  requires_verification?: boolean;
  options?: any;
  help_text?: string;
  placeholder?: string;
  sort_order?: number;
  is_searchable?: boolean;
  search_priority?: number;
  min?: number;
  max?: number;
  char_limit?: number;
  business_type_id?: string;
  acl?: {
    read: string[];
    write: string[];
    distribution?: string[];
  };
  validation?: any;
  required_feature?: string;
}

// Keep FormField for backward compatibility with older parts of the codebase
export interface FormField extends GovernanceField {
  searchable?: boolean;
  search_step?: string;
  default_value?: string;
  inherited?: boolean;
}

export interface Business {
  id: string;
  name: string;
  type_id: string;
  location_id: string | null;
  vendor_id: string | null;
  subscription_tier: string;
  status: 'active' | 'inactive' | 'hidden' | 'pending';
  published: boolean;
  approved_by_vendor: boolean;
  views: number;
  custom_data: Record<string, Record<string, any>>;
  draft_data: Record<string, Record<string, any>>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  role: string;
  display_name: string | null;
  avatar_url: string | null;
  subscription_tier: string;
  business_id: string | null;
  active: boolean;
  created_at: string;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  price_amount: number;
  price_currency: string;
  price_period: string;
  version: number;
  features: Record<string, any>;
  active: boolean;
}

export interface SearchPolicy {
  id: string;
  name: string;
  description: string;
  role: string;
  allowed_fields: string[];
}

export interface SearchEngine {
  id: string;
  name: string;
  allowed_fields: string[];
  filters: any[];
  active: boolean;
}

export interface SearchPage {
  id: string;
  title: string;
  slug: string;
  target_type: string;
  target_id: string;
}

export interface CustomExpression {
  id: string;
  name: string;
  type: string;
  options: string[];
  searchable: boolean;
}

export interface CardTemplate {
  id: string;
  business_type_id: string;
  layout: string;
  visible_fields: string[];
  policy_id: string | null;
}

export interface WebsiteTemplate {
  id: string;
  header_components: any[];
  body_components: any[];
  footer_components: any[];
  site_settings: Record<string, any>;
}

export interface ExperiencePackage {
  id: string;
  name: string;
  description: string;
  business_ids: string[];
  pricing: Record<string, any>;
  active: boolean;
}

export interface UpgradeRequest {
  id: string;
  business_id: string;
  requested_by: string | null;
  client_name: string;
  requested_tier: string;
  requested_features: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface AuditEntry {
  id: string;
  user_id: string | null;
  user_email: string;
  user_role: string;
  action: string;
  details: string;
  created_at: string;
}

export interface ActivityEntry {
  id: number;
  message: string;
  user_email: string;
  created_at: string;
}
