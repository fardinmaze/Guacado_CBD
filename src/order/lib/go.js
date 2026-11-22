import { categories, findItem, isQuickAdd } from './catalog'

/**
 * Where to send a guest once a store is known. The marketing site links to `/order?go=<target>`:
 *   build            -> the build-your-own flow (base picker first)
 *   build:<base>     -> the builder with that base already chosen (e.g. build:burrito)
 *   family           -> the family kits picker; family:<kit> -> customize that kit
 *   kids             -> the kids meal chooser; kids:<item> -> build that kids meal
 *   drinks           -> the drinks page (every drink as a photo card); cat:beverages goes there too
 *   catering:<item>[:people] -> catering event details for that package (e.g. catering:office-lunch:20)
 *   item:<slug>      -> that item's options page (items with no choices fall back to their category)
 *   cat:<slug>       -> the menu, scrolled to that category
 * Anything unknown lands on the store menu. Returns a vue-router location.
 */
export function goPath(storeSlug, go) {
  const base = `/order/${storeSlug}`
  const target = Array.isArray(go) ? go[0] : go
  if (typeof target !== 'string') return { path: base }

  if (target === 'build') return { path: `${base}/build` }
  if (/^build:[a-z-]+$/.test(target)) return { path: `${base}/build`, query: { base: target.slice(6) } }
  if (target === 'family') return { path: `${base}/family` }
  if (target === 'kids') return { path: `${base}/kids` }
  if (target === 'drinks' || target === 'cat:beverages') return { path: `${base}/drinks` }
  const cater = /^catering:([a-z-]+)(?::(\d{1,3}))?$/.exec(target)
  if (cater && findItem(cater[1])?.category === 'catering') return { path: `${base}/catering/${cater[1]}`, ...(cater[2] ? { query: { people: cater[2] } } : {}) }
  if (/^kids:[a-z-]+$/.test(target) && findItem(target.slice(5))?.category === 'kids') return { path: `${base}/kids/${target.slice(5)}` }
  if (/^family:[a-z-]+$/.test(target) && findItem(target.slice(7))?.category === 'family-kits') return { path: `${base}/family/${target.slice(7)}` }

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
