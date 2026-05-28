import { PageLayout, PageTemplate, AvailableSearchComponent, PageBlock } from './page-builder-types'
import { query, execute } from '@/lib/db'

// Lightweight in-memory stubs to satisfy imports and enable incremental work
const store: { pages: PageLayout[]; templates: PageTemplate[] } = {
  pages: [],
  templates: [],
}

// Admin notification queue
const adminNotifications: any[] = []

/**
 * Get current timestamp in ISO format
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Log admin notification
 */
async function notifyAdmin(action: string, details: any, userEmail?: string): Promise<void> {
  const notification = {
    id: crypto.randomUUID(),
    action,
    details,
    userEmail,
    timestamp: getCurrentTimestamp(),
    read: false,
  }
  adminNotifications.push(notification)
  
  try {
    // Save to database activity log
    await execute(
      `INSERT INTO activity_log (message, user_email) VALUES (?, ?)`,
      [`${action}: ${JSON.stringify(details)}`, userEmail || 'system']
    )
  } catch (e) {
    console.error('Failed to log admin notification:', e)
  }
}

export async function getAllPages(): Promise<PageLayout[]> {
  try {
    const results = await query(
      `SELECT config FROM website_configs WHERE type LIKE 'website_%' ORDER BY created_at DESC`,
      []
    )
    return results.map((row: any) => {
      const config = typeof row.config === 'string' ? JSON.parse(row.config) : row.config
      return config as PageLayout
    }).filter(p => p && p.slug)
  } catch (e) {
    console.error('Failed to fetch pages from database:', e)
    return store.pages
  }
}

export async function createPageLayout(data: Partial<PageLayout>): Promise<PageLayout> {
  const slug = data.slug || 'page-' + Date.now()
  const now = getCurrentTimestamp()
  const userEmail = data.createdBy || 'admin'
  
  const newPage: PageLayout = {
    id: crypto.randomUUID(),
    title: data.title || 'Untitled',
    slug: slug,
    published: false,
    blocks: data.blocks || [],
    siteType: data.siteType || 'main-site',
    version: 1,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    createdBy: userEmail,
    updatedBy: userEmail,
  }

  try {
    // Save to database using website_configs table
    const type = `website_${slug}`
    const config = JSON.stringify(newPage)
    
    await execute(
      `INSERT INTO website_configs (type, config) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE config = VALUES(config)`,
      [type, config]
    )
    
    // Notify admin
    await notifyAdmin('PAGE_CREATED', { slug, title: newPage.title, status: 'draft' }, userEmail)
    
    store.pages.push(newPage)
    return newPage
  } catch (e: any) {
    console.error('Failed to save page to database:', e)
    // Fallback to in-memory storage
    store.pages.push(newPage)
    return newPage
  }
}

export async function getPageLayout(pageId: string): Promise<PageLayout | null> {
  try {
    // Try to fetch from database first
    const results = await query(
      `SELECT config FROM website_configs WHERE type = ? LIMIT 1`,
      [`website_${pageId}`]
    )
    
    if (results.length > 0) {
      const config = typeof results[0].config === 'string' 
        ? JSON.parse(results[0].config) 
        : results[0].config
      return config as PageLayout
    }
  } catch (e) {
    console.error('Failed to fetch page from database:', e)
  }
  
  // Fallback to in-memory storage
  return store.pages.find((p) => p.id === pageId) || null
}

export async function updatePageLayout(pageId: string, updates: Partial<PageLayout>): Promise<PageLayout | null> {
  try {
    // Fetch current page
    const current = await getPageLayout(pageId)
    if (!current) return null
    
    const updated = { ...current, ...updates }
    const type = `website_${current.slug}`
    const config = JSON.stringify(updated)
    
    await execute(
      `UPDATE website_configs SET config = ? WHERE type = ?`,
      [config, type]
    )
    
    return updated
  } catch (e) {
    console.error('Failed to update page in database:', e)
    // Fallback to in-memory
    const idx = store.pages.findIndex((p) => p.id === pageId)
    if (idx === -1) return null
    store.pages[idx] = { ...store.pages[idx], ...updates }
    return store.pages[idx]
  }
}

export async function addSearchComponentBlock(pageId: string, block: Partial<PageBlock>): Promise<PageBlock> {
  try {
    const page = await getPageLayout(pageId)
    if (!page) throw new Error('Page not found')
    
    const blockIndex = page.blocks.length + 1
    const serial = `${page.slug}:comp_${String(blockIndex).padStart(3, '0')}`
    const now = getCurrentTimestamp()
    
    const newBlock: PageBlock = {
      id: crypto.randomUUID(),
      serial: serial,
      type: block.type || 'search-component',
      order: page.blocks.length,
      props: block.props || {},
      status: 'active',
      isVisible: true,
      createdAt: now,
      updatedAt: now,
      createdBy: block.createdBy || 'admin',
      updatedBy: block.updatedBy || 'admin',
      metadata: {
        editCount: 0,
        lastEditedBy: block.createdBy || 'admin',
        notifyAdmins: true,
        priority: 'medium',
        tags: block.metadata?.tags || [],
      }
    }
    
    page.blocks.push(newBlock)
    await updatePageLayout(pageId, page)
    
    // Notify admin
    await notifyAdmin('COMPONENT_ADDED', { 
      serial, 
      type: newBlock.type, 
      pageSlug: page.slug,
      status: 'active' 
    }, newBlock.createdBy)
    
    return newBlock
  } catch (e) {
    console.error('Failed to add block:', e)
    const page = store.pages.find((p) => p.id === pageId)
    if (!page) throw new Error('Page not found')
    
    const blockIndex = page.blocks.length + 1
    const serial = `${page.slug}:comp_${String(blockIndex).padStart(3, '0')}`
    const newBlock: PageBlock = {
      id: crypto.randomUUID(),
      serial: serial,
      type: block.type || 'search-component',
      order: page.blocks.length,
      props: block.props || {},
    }
    page.blocks.push(newBlock)
    return newBlock
  }
}

export async function reorderBlocks(pageId: string, ids: string[]): Promise<boolean> {
  try {
    const page = await getPageLayout(pageId)
    if (!page) return false
    
    const newBlocks = ids.map((id, idx) => {
      const b = page.blocks.find((bb) => bb.id === id)!
      return { ...b, order: idx }
    })
    page.blocks = newBlocks
    await updatePageLayout(pageId, page)
    return true
  } catch (e) {
    console.error('Failed to reorder blocks:', e)
    // Fallback to in-memory
    const page = store.pages.find((p) => p.id === pageId)
    if (!page) return false
    const newBlocks = ids.map((id, idx) => {
      const b = page.blocks.find((bb) => bb.id === id)!
      return { ...b, order: idx }
    })
    page.blocks = newBlocks
    return true
  }
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
  try {
    const page = await getPageLayout(pageId)
    if (!page) return false
    
    const blockToRemove = page.blocks.find((b) => b.id === blockId)
    if (!blockToRemove) return false
    
    const filtered = page.blocks.filter((b) => b.id !== blockId)
    if (filtered.length === page.blocks.length) return false // Not found
    
    page.blocks = filtered
    await updatePageLayout(pageId, page)
    
    // Notify admin about deletion
    await notifyAdmin('COMPONENT_DELETED', { 
      serial: blockToRemove.serial,
      type: blockToRemove.type,
      status: blockToRemove.status,
      pageSlug: page.slug,
    }, 'admin')
    
    return true
  } catch (e) {
    console.error('Failed to remove block:', e)
    // Fallback to in-memory
    const page = store.pages.find((p) => p.id === pageId)
    if (!page) return false
    page.blocks = page.blocks.filter((b) => b.id !== blockId)
    return true
  }
}

export async function updateBlock(pageId: string, updatedBlock: PageBlock): Promise<PageBlock | null> {
  try {
    const page = await getPageLayout(pageId)
    if (!page) return null
    
    const idx = page.blocks.findIndex((b) => b.id === updatedBlock.id)
    if (idx === -1) return null
    
    const oldBlock = page.blocks[idx]
    const now = getCurrentTimestamp()
    
    // Track edit count and update metadata
    const editCount = (oldBlock.metadata?.editCount || 0) + 1
    const userEmail = updatedBlock.updatedBy || 'admin'
    
    const mergedBlock: PageBlock = {
      ...updatedBlock,
      updatedAt: now,
      updatedBy: userEmail,
      metadata: {
        ...oldBlock.metadata,
        editCount,
        lastEditedBy: userEmail,
      }
    }
    
    page.blocks[idx] = mergedBlock
    await updatePageLayout(pageId, page)
    
    // Notify admin about changes
    await notifyAdmin('COMPONENT_UPDATED', { 
      serial: mergedBlock.serial,
      type: mergedBlock.type,
      editCount,
      status: mergedBlock.status,
      pageSlug: page.slug,
    }, userEmail)
    
    return mergedBlock
  } catch (e) {
    console.error('Failed to update block:', e)
    // Fallback to in-memory
    const page = store.pages.find((p) => p.id === pageId)
    if (!page) return null
    const idx = page.blocks.findIndex((b) => b.id === updatedBlock.id)
    if (idx === -1) return null
    page.blocks[idx] = updatedBlock
    return updatedBlock
  }
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

/**
 * ADMIN DASHBOARD HELPERS
 */

/**
 * Get component status summary for a page
 */
export async function getComponentStatusSummary(pageId: string): Promise<{
  total: number
  active: number
  inactive: number
  draft: number
  archived: number
  lastModified: string
  components: Array<{
    serial: string
    type: string
    status: string
    isVisible: boolean
    editCount: number
    lastEditedBy: string
  }>
}> {
  const page = await getPageLayout(pageId)
  if (!page) return { total: 0, active: 0, inactive: 0, draft: 0, archived: 0, lastModified: '', components: [] }
  
  const summary = {
    total: page.blocks.length,
    active: page.blocks.filter(b => b.status === 'active').length,
    inactive: page.blocks.filter(b => b.status === 'inactive').length,
    draft: page.blocks.filter(b => b.status === 'draft').length,
    archived: page.blocks.filter(b => b.status === 'archived').length,
    lastModified: page.updatedAt || '',
    components: page.blocks.map(b => ({
      serial: b.serial || 'unknown',
      type: b.type,
      status: b.status || 'active',
      isVisible: b.isVisible !== false,
      editCount: b.metadata?.editCount || 0,
      lastEditedBy: b.metadata?.lastEditedBy || 'unknown',
    }))
  }
  
  return summary
}

/**
 * Toggle component visibility
 */
export async function toggleComponentVisibility(pageId: string, blockId: string): Promise<boolean> {
  try {
    const page = await getPageLayout(pageId)
    if (!page) return false
    
    const block = page.blocks.find(b => b.id === blockId)
    if (!block) return false
    
    block.isVisible = !block.isVisible
    block.updatedAt = getCurrentTimestamp()
    
    await updatePageLayout(pageId, page)
    
    await notifyAdmin('COMPONENT_VISIBILITY_TOGGLED', { 
      serial: block.serial,
      isVisible: block.isVisible,
      pageSlug: page.slug,
    }, 'admin')
    
    return true
  } catch (e) {
    console.error('Failed to toggle visibility:', e)
    return false
  }
}

/**
 * Change component status
 */
export async function changeComponentStatus(
  pageId: string, 
  blockId: string, 
  newStatus: 'active' | 'inactive' | 'draft' | 'archived'
): Promise<boolean> {
  try {
    const page = await getPageLayout(pageId)
    if (!page) return false
    
    const block = page.blocks.find(b => b.id === blockId)
    if (!block) return false
    
    const oldStatus = block.status
    block.status = newStatus
    block.updatedAt = getCurrentTimestamp()
    
    await updatePageLayout(pageId, page)
    
    await notifyAdmin('COMPONENT_STATUS_CHANGED', { 
      serial: block.serial,
      oldStatus,
      newStatus,
      pageSlug: page.slug,
    }, 'admin')
    
    return true
  } catch (e) {
    console.error('Failed to change component status:', e)
    return false
  }
}

/**
 * Get all admin notifications
 */
export function getAdminNotifications(limit: number = 50) {
  return adminNotifications.slice(-limit).reverse()
}

/**
 * Mark notification as read
 */
export function markNotificationAsRead(notificationId: string): boolean {
  const notif = adminNotifications.find(n => n.id === notificationId)
  if (notif) {
    notif.read = true
    return true
  }
  return false
}

/**
 * Get unread notification count
 */
export function getUnreadNotificationCount(): number {
  return adminNotifications.filter(n => !n.read).length
}

/**
 * Get components by status
 */
export async function getComponentsByStatus(
  pageId: string, 
  status: 'active' | 'inactive' | 'draft' | 'archived'
): Promise<PageBlock[]> {
  const page = await getPageLayout(pageId)
  if (!page) return []
  
  return page.blocks.filter(b => b.status === status)
}

/**
 * Get page activity log
 */
export async function getPageActivityLog(pageId: string): Promise<any[]> {
  try {
    const page = await getPageLayout(pageId)
    if (!page) return []
    
    const results = await query(
      `SELECT message, user_email, created_at FROM activity_log 
       WHERE message LIKE ? 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [`%${page.slug}%`]
    )
    
    return results || []
  } catch (e) {
    console.error('Failed to fetch activity log:', e)
    return []
  }
}
