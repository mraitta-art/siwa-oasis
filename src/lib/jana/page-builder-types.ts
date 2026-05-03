export interface PageBlock {
  id: string
  type: string
  order: number
  props?: Record<string, any>
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
