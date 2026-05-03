import { PageLayout, PageTemplate, AvailableSearchComponent, PageBlock } from './page-builder-types'

// Lightweight in-memory stubs to satisfy imports and enable incremental work
const store: { pages: PageLayout[]; templates: PageTemplate[] } = {
  pages: [],
  templates: [],
}

export async function getAllPages(): Promise<PageLayout[]> {
  return store.pages
}

export async function createPageLayout(data: Partial<PageLayout>): Promise<PageLayout> {
  const newPage: PageLayout = {
    id: `${Date.now()}`,
    title: data.title || 'Untitled',
    slug: data.slug || 'untitled-' + Date.now(),
    published: false,
    blocks: data.blocks || [],
    siteType: data.siteType || 'main-site',
    version: 1,
  }
  store.pages.push(newPage)
  return newPage
}

export async function getPageLayout(pageId: string): Promise<PageLayout | null> {
  return store.pages.find((p) => p.id === pageId) || null
}

export async function updatePageLayout(pageId: string, updates: Partial<PageLayout>): Promise<PageLayout | null> {
  const idx = store.pages.findIndex((p) => p.id === pageId)
  if (idx === -1) return null
  store.pages[idx] = { ...store.pages[idx], ...updates }
  return store.pages[idx]
}

export async function addSearchComponentBlock(pageId: string, block: Partial<PageBlock>): Promise<PageBlock> {
  const page = store.pages.find((p) => p.id === pageId)
  const newBlock: PageBlock = {
    id: `${Date.now()}`,
    type: block.type || 'search-component',
    order: page ? page.blocks.length : 0,
    props: block.props || {},
  }
  if (page) {
    page.blocks.push(newBlock)
  }
  return newBlock
}

export async function reorderBlocks(pageId: string, ids: string[]): Promise<boolean> {
  const page = store.pages.find((p) => p.id === pageId)
  if (!page) return false
  const newBlocks = ids.map((id, idx) => {
    const b = page.blocks.find((bb) => bb.id === id)!
    return { ...b, order: idx }
  })
  page.blocks = newBlocks
  return true
}

export async function getAvailableSearchComponents(includeHidden = false): Promise<AvailableSearchComponent[]> {
  return [
    { id: 'comp-1', name: 'Basic Search', description: 'Basic search box', allowedFields: ['name', 'type'] },
  ]
}

export function checkSiteTypeRestriction(siteType: string | undefined, action: string) {
  return { allowed: true, message: '' }
}

export async function removeBlock(pageId: string, blockId: string): Promise<boolean> {
  const page = store.pages.find((p) => p.id === pageId)
  if (!page) return false
  page.blocks = page.blocks.filter((b) => b.id !== blockId)
  return true
}

export async function updateBlock(pageId: string, updatedBlock: PageBlock): Promise<PageBlock | null> {
  const page = store.pages.find((p) => p.id === pageId)
  if (!page) return null
  const idx = page.blocks.findIndex((b) => b.id === updatedBlock.id)
  if (idx === -1) return null
  page.blocks[idx] = updatedBlock
  return updatedBlock
}

export async function getAllTemplates(): Promise<PageTemplate[]> {
  return store.templates
}

export async function createTemplate(data: Partial<PageTemplate>): Promise<PageTemplate> {
  const tpl: PageTemplate = {
    id: `${Date.now()}`,
    name: data.name || 'Template',
    description: data.description || '',
    components: data.components || [],
    isActive: data.isActive ?? true,
    allowComponentReorder: data.allowComponentReorder ?? false,
    allowStyleCustomization: data.allowStyleCustomization ?? false,
  }
  store.templates.push(tpl)
  return tpl
}
