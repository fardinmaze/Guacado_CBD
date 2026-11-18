import { computed, reactive, watch } from 'vue'
import { findItem, findStore, isOrderable, taxRateFor } from './lib/catalog'
import { defaultSelection, isStale, lineCents, setLevel, togglePick, totals } from './lib/pricing'

// One persisted store for the guest's store choice, the bag and the meal being built.
// This is what makes a refresh or the back gesture safe (the #1 bug in the app we analysed).
const KEY = 'guacado.order.v1'

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
    return {
      storeSlug: isOrderable(findStore(raw.storeSlug)) ? raw.storeSlug : null,
      lines: (raw.lines ?? []).filter((l) => findItem(l.itemSlug)),
      utensils: !!raw.utensils,
      // A draft saved under an older menu (renamed or removed options) is dropped, not half-loaded.
      draft: raw.draft && findItem(raw.draft.itemSlug) && !isStale(findItem(raw.draft.itemSlug), raw.draft.selections) ? raw.draft : null,
    }
  } catch {
    return { storeSlug: null, lines: [], draft: null, utensils: false }
  }
}

const state = reactive(load())
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* private mode: the order still works for this session */
  }
}
watch(state, save, { deep: true })

const uid = () => Math.random().toString(36).slice(2, 10)

export function useOrder() {
  const store = computed(() => findStore(state.storeSlug))
  const count = computed(() => state.lines.reduce((n, l) => n + l.qty, 0))
  const subtotal = computed(() => state.lines.reduce((sum, l) => sum + lineCents(findItem(l.itemSlug), l), 0))
  // Tax uses the store's confirmed rate, else a sample state rate (flagged as estimated).
  const totalsFor = (tipPct = 0) => ({
    ...totals(subtotal.value, { rate: taxRateFor(store.value), tipPct }),
    taxEstimated: store.value?.taxRate == null,
  })

  const draftItem = computed(() => (state.draft ? findItem(state.draft.itemSlug) : null))
  const draftUnit = computed(() => (draftItem.value ? lineCents(draftItem.value, { selections: state.draft.selections, qty: 1 }) : 0))

  function chooseStore(slug) {
    if (!isOrderable(findStore(slug))) return false
    if (state.storeSlug !== slug) state.storeSlug = slug
    return true
  }

  /** Start (or resume) a draft for an item. `fromLine` loads a bag line for editing. */
  function openDraft(itemSlug, fromLine = null) {
    if (state.draft && state.draft.itemSlug === itemSlug && state.draft.editId === (fromLine?.id ?? null)) return state.draft
    const item = findItem(itemSlug)
    state.draft = fromLine
      ? { itemSlug, selections: JSON.parse(JSON.stringify(fromLine.selections)), label: fromLine.label, qty: fromLine.qty, editId: fromLine.id, extras: [] }
      : { itemSlug, selections: defaultSelection(item), label: '', qty: 1, editId: null, extras: [] }
    return state.draft
  }

  function pick(groupKey, name) {
    const g = draftItem.value.groups.find((x) => x.key === groupKey)
    state.draft.selections[groupKey] = togglePick(g, state.draft.selections[groupKey] ?? [], name)
  }
  function level(groupKey, name, lvl) {
    state.draft.selections[groupKey] = setLevel(state.draft.selections[groupKey] ?? [], name, lvl)
  }
  // Sides, drinks and desserts picked on the builder: added to the bag as their own lines.
  // Each is { slug, selections } (selections hold a choice such as the Jarritos flavor).
  const extrasOf = () => (state.draft.extras ?? (state.draft.extras = []))
  function toggleExtra(slug) {
    const list = extrasOf()
    const at = list.findIndex((x) => (x.slug ?? x) === slug)
    if (at >= 0) list.splice(at, 1)
    else list.push({ slug, selections: {} })
  }
  function setExtraChoice(slug, groupKey, name) {
    const x = extrasOf().find((e) => e.slug === slug)
    if (x) x.selections = { ...x.selections, [groupKey]: [{ name, level: 'regular' }] }
  }
  const setUtensils = (on) => (state.utensils = !!on)
  const clear = (groupKey) => (state.draft.selections[groupKey] = [])
  const setQty = (n) => (state.draft.qty = Math.min(20, Math.max(1, n)))
  const setLabel = (text) => (state.draft.label = text.slice(0, 30))
  const discardDraft = () => (state.draft = null)

  function commitDraft() {
    const d = state.draft
    const line = { id: d.editId ?? uid(), itemSlug: d.itemSlug, qty: d.qty, label: d.label.trim(), selections: d.selections }
    const at = state.lines.findIndex((l) => l.id === line.id)
    if (at >= 0) state.lines.splice(at, 1, line)
    else state.lines.push(line)
    for (const x of d.extras ?? []) {
      const slug = x.slug ?? x
      const sel = x.selections ?? {}
      if (!findItem(slug)) continue
      if (Object.keys(sel).length) state.lines.push({ id: uid(), itemSlug: slug, qty: 1, label: '', selections: sel })
      else quickAdd(slug)
    }
    state.draft = null
    return line
  }

  const quickAdd = (itemSlug) => {
    const existing = state.lines.find((l) => l.itemSlug === itemSlug && !l.label && !Object.keys(l.selections).length)
    if (existing) existing.qty = Math.min(20, existing.qty + 1)
    else state.lines.push({ id: uid(), itemSlug, qty: 1, label: '', selections: {} })
  }
  const removeLine = (id) => (state.lines = state.lines.filter((l) => l.id !== id))
  const duplicateLine = (id) => {
    const l = state.lines.find((x) => x.id === id)
    if (l) state.lines.splice(state.lines.indexOf(l) + 1, 0, { ...JSON.parse(JSON.stringify(l)), id: uid() })
  }
  const setLineQty = (id, n) => {
    const l = state.lines.find((x) => x.id === id)
    if (!l) return
    if (n < 1) removeLine(id)
    else l.qty = Math.min(20, n)
  }
  const clearBag = () => (state.lines = [])

  return {
    state, store, count, subtotal, totalsFor, draftItem, draftUnit,
    chooseStore, openDraft, pick, level, clear, toggleExtra, setExtraChoice, setUtensils, setQty, setLabel, discardDraft, commitDraft,
    quickAdd, removeLine, duplicateLine, setLineQty, clearBag,
  }
}

/** Test helper: reset the singleton between tests. */
export function __resetOrder() {
  state.storeSlug = null
  state.lines = []
  state.draft = null
  state.utensils = false
}
