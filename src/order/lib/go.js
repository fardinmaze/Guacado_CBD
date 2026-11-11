import { categories, findItem, isQuickAdd } from './catalog'

/**
 * Where to send a guest once a store is known. The marketing site links to `/order?go=<target>`:
 *   build            -> the build-your-own flow
 *   item:<slug>      -> that item's options page (items with no choices fall back to their category)
 *   cat:<slug>       -> the menu, scrolled to that category
 * Anything unknown lands on the store menu. Returns a vue-router location.
 */
export function goPath(storeSlug, go) {
  const base = `/order/${storeSlug}`
  const target = Array.isArray(go) ? go[0] : go
  if (typeof target !== 'string') return { path: base }

  if (target === 'build') return { path: `${base}/build` }

  if (target.startsWith('item:')) {
    const item = findItem(target.slice(5))
    if (!item) return { path: base }
    if (isQuickAdd(item)) return { path: base, hash: `#cat-${item.category}` }
    return { path: `${base}/item/${item.slug}` }
  }

  if (target.startsWith('cat:')) {
    const slug = target.slice(4)
    return categories.some((c) => c.slug === slug) ? { path: base, hash: `#cat-${slug}` } : { path: base }
  }

  return { path: base }
}
