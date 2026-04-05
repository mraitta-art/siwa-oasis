import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Builds the nested location tree (Egypt -> Matrouh -> Siwa)
 */
export async function getLocationTree() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: locations, error } = await supabase
    .from('locations')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (error || !locations) return [];

  // Build tree logic
  const locationMap = new Map();
  locations.forEach(loc => locationMap.set(loc.id, { ...loc, children: [] }));
  
  const tree: any[] = [];
  locations.forEach(loc => {
    if (loc.parent_id) {
      const parent = locationMap.get(loc.parent_id);
      if (parent) parent.children.push(locationMap.get(loc.id));
    } else {
      tree.push(locationMap.get(loc.id));
    }
  });

  return tree;
}

/**
 * Gets taxonomy definitions based on the requested parent
 */
export async function getBusinessTypes(parentId: string | null = null) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  let query = supabase
    .from('business_types')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (parentId) {
    query = query.eq('parent_id', parentId)
  } else {
    query = query.eq('is_parent', true)
  }

  const { data, error } = await query
  return error ? [] : data;
}
