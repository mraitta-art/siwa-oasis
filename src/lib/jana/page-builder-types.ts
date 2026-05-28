export interface PageBlock {
  id: string                    // UUID
  serial?: string               // Unique serial: page_slug:comp_001
  type: string
  order: number
  props?: Record<string, any>
  status?: 'active' | 'inactive' | 'draft' | 'archived'  // Component status
  isVisible?: boolean            // Visibility toggle
  publishedAt?: string          // When published
  createdAt?: string            // Creation timestamp
  updatedAt?: string            // Last update timestamp
  createdBy?: string            // Admin email
  updatedBy?: string            // Last editor email
  metadata?: {
    editCount?: number
    lastEditedBy?: string
    notifyAdmins?: boolean
    priority?: 'low' | 'medium' | 'high'
    tags?: string[]
  }
}

export interface PageLayout {
  id: string
  title: string
  slug: string
  published?: boolean
  publishedAt?: string
  blocks: PageBlock[]
  siteType?: 'main-site' | 'mini-site'
  version?: number
  status?: 'draft' | 'published' | 'archived'
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  updatedBy?: string
}

export interface PageTemplate {
  id: string
  name: string
  description?: string
  components: PageBlock[]
  isActive?: boolean
  allowComponentReorder?: boolean
  allowStyleCustomization?: boolean
}

export interface AvailableSearchComponent {
  id: string
  name: string
  description?: string
  allowedFields: string[]
}
