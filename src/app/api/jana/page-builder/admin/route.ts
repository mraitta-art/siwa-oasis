/**
 * Admin Dashboard API - Component Status & Notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getComponentStatusSummary,
  toggleComponentVisibility,
  changeComponentStatus,
  getAdminNotifications,
  getUnreadNotificationCount,
  getComponentsByStatus,
  getPageActivityLog,
} from '@/lib/jana/page-builder-service'

/**
 * GET /api/jana/page-builder/admin
 * Query params:
 * - action: 'status' | 'notifications' | 'unread' | 'activity'
 * - pageId: page ID for status/activity
 * - status: component status filter
 * - limit: max results
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const pageId = searchParams.get('pageId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    switch (action) {
      case 'status':
        if (!pageId) return NextResponse.json({ error: 'pageId required' }, { status: 400 })
        const summary = await getComponentStatusSummary(pageId)
        return NextResponse.json(summary)

      case 'notifications':
        const notifications = getAdminNotifications(limit)
        return NextResponse.json(notifications)

      case 'unread':
        const unreadCount = getUnreadNotificationCount()
        return NextResponse.json({ unreadCount })

      case 'activity':
        if (!pageId) return NextResponse.json({ error: 'pageId required' }, { status: 400 })
        const activity = await getPageActivityLog(pageId)
        return NextResponse.json(activity)

      case 'components-by-status':
        if (!pageId || !status) {
          return NextResponse.json({ error: 'pageId and status required' }, { status: 400 })
        }
        const components = await getComponentsByStatus(
          pageId,
          status as 'active' | 'inactive' | 'draft' | 'archived'
        )
        return NextResponse.json(components)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/jana/page-builder/admin
 * Body:
 * - action: 'toggle-visibility' | 'change-status'
 * - pageId: page ID
 * - blockId: component ID
 * - newStatus: new status (for change-status)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, pageId, blockId, newStatus } = body

    if (!pageId || !blockId) {
      return NextResponse.json({ error: 'pageId and blockId required' }, { status: 400 })
    }

    switch (action) {
      case 'toggle-visibility':
        const visibilityResult = await toggleComponentVisibility(pageId, blockId)
        return NextResponse.json({ success: visibilityResult })

      case 'change-status':
        if (!newStatus) {
          return NextResponse.json({ error: 'newStatus required' }, { status: 400 })
        }
        const statusResult = await changeComponentStatus(pageId, blockId, newStatus)
        return NextResponse.json({ success: statusResult })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
