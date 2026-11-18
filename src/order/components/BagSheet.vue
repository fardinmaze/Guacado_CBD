<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { findItem } from '@/order/lib/catalog'
import { breakdown, cents, lineCents } from '@/order/lib/pricing'
import { useOrder } from '@/order/useOrder'
import { useBagSheet } from '@/order/useBagSheet'
import { promoLinks } from '@/data/site'

// Bag drawer (slides in from the right; full width on phones). Per meal: its name, the full
// breakdown with prices, quantity and icon buttons (edit / duplicate / remove). Then napkins &
// utensils, subtotal + tax (estimated until each store's rate is confirmed), total, and the
// Rewards invitation (placeholder links in src/data/site.js).
const { open, hide } = useBagSheet()
const order = useOrder()
const router = useRouter()
const root = ref(null)
const closeBtn = ref(null)
let opener = null

const store = computed(() => order.store.value)
const t = computed(() => order.totalsFor(0))
const toSlug = (name) => name.toLowerCase().replace(/[^a-z]+/g, '-')

const view = (line) => {
  const item = findItem(line.itemSlug)
  const isBuild = item.slug === 'build-your-own'
  const base = line.selections.base?.[0]?.name
  const what = isBuild && base ? base : item.name
  return {
    line,
    item,
    title: line.label || what,
    sub: line.label ? what : '',
    // Skip a row that only repeats the heading ("Burrito", "Organic Lemonade") unless it carries a price
    // the line needs (a fixed item's own price shows as the line total anyway).
    rows: breakdown(item, line.selections).filter((r) => r.label !== (line.label ? what : item.name) && r.label !== what),
    total: lineCents(item, line),
    editable: !!item.groups?.length || item.kind === 'CATERING',
    perPerson: !!item.perPerson,
    min: item.perPerson ? item.minPeople ?? 1 : 1,
    step: item.perPerson ? 5 : 1,
    when: line.event ? whenText(line.event) : '',
  }
}
const lines = computed(() => order.state.lines.map(view))
function whenText(e) {
  const d = new Date(`${e.date}T${e.time}`)
  if (Number.isNaN(d.getTime())) return ''
  return `Pickup ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

function onKey(e) {
  if (e.key === 'Escape') return hide()
  if (e.key !== 'Tab' || !root.value) return
  const f = root.value.querySelectorAll('a[href], button:not([disabled]), input')
  if (!f.length) return
  const first = f[0]
  const last = f[f.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}

watch(open, async (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''
  if (isOpen) {
    opener = document.activeElement
    document.addEventListener('keydown', onKey)
    await nextTick()
    closeBtn.value?.focus()
  } else {
    document.removeEventListener('keydown', onKey)
    opener?.focus?.()
  }
})
onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKey)
})

function edit(v) {
  hide()
  const slug = order.state.storeSlug
  const base = v.line.selections.base?.[0]?.name
  const to = v.item.slug === 'build-your-own'
    ? { path: `/order/${slug}/build`, query: { edit: v.line.id, ...(base ? { base: toSlug(base) } : {}) } }
    : v.item.category === 'catering'
      ? { path: `/order/${slug}/catering/${v.item.slug}`, query: { edit: v.line.id } }
      : v.item.category === 'family-kits' || v.item.category === 'kids'
      ? { path: `/order/${slug}/${v.item.category === 'kids' ? 'kids' : 'family'}/${v.item.slug}`, query: { edit: v.line.id } }
      : { path: `/order/${slug}/item/${v.item.slug}`, query: { edit: v.line.id } }
  router.push(to)
}
function checkout() {
  hide()
  router.push('/order/checkout')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="scrim" @click.self="hide">
        <div ref="root" class="sheet" role="dialog" aria-modal="true" aria-labelledby="bag-title">
          <header class="sheet__top">
            <div>
              <h2 id="bag-title">Your bag</h2>
              <p v-if="store" class="where">Pickup from {{ store.address }}, {{ store.city }}</p>
            </div>
            <button ref="closeBtn" type="button" class="x" aria-label="Close bag" @click="hide">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </header>

          <div v-if="!lines.length" class="empty">
            <p class="empty__t">Your bag is empty.</p>
            <p>Pick something from the menu and it will wait here, even if you refresh.</p>
            <button type="button" class="cta" @click="hide">Back to menu</button>
          </div>

          <div v-else class="body">
            <ul class="lines">
              <li v-for="v in lines" :key="v.line.id" class="line">
                <div class="line__head">
                  <div class="line__names">
                    <p class="line__name">{{ v.title }}</p>
                    <p v-if="v.sub" class="line__sub">{{ v.sub }}</p>
                    <p v-if="v.when" class="line__sub">{{ v.when }}</p>
                  </div>
                  <div class="icons">
                    <button v-if="v.editable" type="button" class="ic" :aria-label="`Edit ${v.title}`" title="Edit" @click="edit(v)">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></svg>
                    </button>
                    <button type="button" class="ic" :aria-label="`Duplicate ${v.title}`" title="Duplicate" @click="order.duplicateLine(v.line.id)">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></svg>
                    </button>
                    <button type="button" class="ic ic--bad" :aria-label="`Remove ${v.title}`" title="Remove" @click="order.removeLine(v.line.id)">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
                    </button>
                  </div>
                </div>

                <dl class="rows">
                  <div v-for="(r, i) in v.rows" :key="i" class="row">
                    <dt>{{ r.label }}</dt>
                    <dd>{{ r.cents == null ? '' : (r.add ? '+' : '') + cents(r.cents) }}</dd>
                  </div>
                </dl>

                <div class="line__foot">
                  <div class="step" role="group" :aria-label="v.perPerson ? `People for ${v.title}` : `Quantity of ${v.title}`">
                    <button type="button" :aria-label="v.perPerson ? `${v.step} fewer people` : 'One fewer'" :disabled="v.perPerson && v.line.qty <= v.min" @click="order.setLineQty(v.line.id, v.line.qty - v.step)">−</button>
                    <span aria-live="polite">{{ v.line.qty }}<small v-if="v.perPerson"> people</small></span>
                    <button type="button" :aria-label="v.perPerson ? `${v.step} more people` : 'One more'" @click="order.setLineQty(v.line.id, v.line.qty + v.step)">+</button>
                  </div>
                  <strong class="line__total">{{ cents(v.total) }}</strong>
                </div>
              </li>
            </ul>

            <label class="ut">
              <input type="checkbox" :checked="order.state.utensils" @change="order.setUtensils($event.target.checked)" />
              <span class="ut__box" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10" /></svg>
              </span>
              <span class="ut__txt"><b>Include napkins &amp; utensils</b><small>Leave this off if you don't need them. It saves waste.</small></span>
            </label>

            <dl class="tot">
              <div><dt>Subtotal</dt><dd>{{ cents(t.subtotal) }}</dd></div>
              <div v-if="t.tax != null"><dt>{{ t.taxEstimated ? 'Estimated tax' : 'Tax' }}</dt><dd>{{ cents(t.tax) }}</dd></div>
              <div v-else><dt>Tax</dt><dd>At checkout</dd></div>
              <div class="grand"><dt>Total</dt><dd>{{ cents(t.total) }}</dd></div>
            </dl>

            <aside class="rw" aria-labelledby="rw-bag">
              <p class="rw__k">Join Rewards</p>
              <h3 id="rw-bag" class="rw__t">Get rewarded.</h3>
              <p class="rw__d">Sign up for Fresh Guacado Rewards and this order can count toward your next free meal.</p>
              <div class="rw__act">
                <a :href="promoLinks.rewardsJoin" class="rw__join">Join now</a>
                <a :href="promoLinks.rewardsLearn" class="rw__learn">Learn more</a>
              </div>
            </aside>
          </div>

          <footer v-if="lines.length" class="sheet__foot">
            <button type="button" class="cta" @click="checkout">Checkout · {{ cents(t.total) }}</button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.scrim { position: fixed; inset: 0; z-index: 80; background: rgba(0, 0, 0, 0.55); display: flex; justify-content: flex-end; }
.sheet { display: flex; flex-direction: column; width: 100%; height: 100%; background: #fff; color: var(--ink); padding-top: env(safe-area-inset-top, 0px); }
@media (min-width: 640px) { .sheet { width: 460px; box-shadow: -18px 0 48px -24px rgba(0, 0, 0, 0.5); } }
.drawer-enter-active, .drawer-leave-active { transition: background-color 0.25s; }
.drawer-enter-active .sheet, .drawer-leave-active .sheet { transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
.drawer-enter-from, .drawer-leave-to { background-color: transparent; }
.drawer-enter-from .sheet, .drawer-leave-to .sheet { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) { .drawer-enter-active .sheet, .drawer-leave-active .sheet { transition: none; } }

.sheet__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 18px var(--gut-r) 14px var(--gut-l); border-bottom: 1px solid var(--line); }
.sheet__top h2 { font: 900 30px/1 var(--f-display); font-stretch: 74%; text-transform: uppercase; }
.where { margin-top: 6px; font-size: 13px; color: var(--ink-muted); }
.x { flex: none; width: 44px; height: 44px; border-radius: 50%; border: 1.5px solid var(--line); background: #fff; color: var(--ink); display: grid; place-items: center; cursor: pointer; }
.x svg { width: 20px; height: 20px; }
.x:focus-visible, .ic:focus-visible, .cta:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

.empty { padding: 48px var(--gut-l); display: grid; gap: 12px; justify-items: start; color: var(--ink-muted); }
.empty__t { font: 900 26px/1.1 var(--f-display); font-stretch: 74%; color: var(--ink); text-transform: uppercase; }

.body { flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: 4px var(--gut-r) 20px var(--gut-l); }
.lines { list-style: none; margin: 0; padding: 0; }
.line { padding: 18px 0; border-bottom: 1px solid var(--line); display: grid; gap: 10px; }
.line__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.line__name { font: 900 22px/1.05 var(--f-display); font-stretch: 76%; text-transform: uppercase; }
.line__sub { margin-top: 3px; font-size: 13px; font-weight: 700; color: var(--ink-muted); }
.icons { display: flex; gap: 2px; flex: none; }
.ic { width: 40px; height: 40px; border: 0; border-radius: 50%; background: none; color: var(--ink); display: grid; place-items: center; cursor: pointer; }
.ic svg { width: 19px; height: 19px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
.ic:hover { background: var(--surface); }
.ic--bad:hover { color: var(--chili); }
.rows { display: grid; gap: 4px; margin: 0; }
.row { display: flex; justify-content: space-between; gap: 12px; font-size: 13.5px; }
.row dt { color: var(--ink-muted); }
.row dd { margin: 0; font-weight: 700; white-space: nowrap; }
.line__foot { display: flex; align-items: center; justify-content: space-between; }
.step { display: inline-flex; align-items: center; border: 1.5px solid var(--line); border-radius: 999px; }
.step button { width: 40px; height: 40px; border: 0; background: transparent; color: var(--ink); font: 700 20px/1 var(--f-body); cursor: pointer; border-radius: 50%; }
.step span { min-width: 26px; padding: 0 4px; text-align: center; font-weight: 800; }
.step small { font-size: 12px; font-weight: 700; color: var(--ink-muted); }
.step button:disabled { opacity: 0.35; cursor: not-allowed; }
.line__total { font: 900 20px/1 var(--f-display); font-stretch: 80%; }

.ut { position: relative; display: flex; gap: 12px; align-items: flex-start; margin-top: 18px; padding: 14px; border: 1px solid var(--line); border-radius: 8px; cursor: pointer; }
.ut input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.ut__box { flex: none; width: 24px; height: 24px; border: 2px solid #c8bfb0; border-radius: 4px; display: grid; place-items: center; color: #fff; }
.ut__box svg { width: 15px; height: 15px; opacity: 0; }
.ut input:checked + .ut__box { background: var(--guac); border-color: var(--guac); }
.ut input:checked + .ut__box svg { opacity: 1; }
.ut input:focus-visible + .ut__box { outline: 3px solid var(--focus); outline-offset: 2px; }
.ut__txt { display: grid; gap: 2px; font-size: 14px; }
.ut__txt small { font-size: 12.5px; color: var(--ink-muted); }

.tot { margin: 18px 0 0; display: grid; gap: 6px; }
.tot div { display: flex; justify-content: space-between; font-size: 14px; }
.tot dd { margin: 0; font-weight: 700; }
.tot .grand { margin-top: 6px; padding-top: 10px; border-top: 1px solid var(--line); font: 900 22px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; }

.rw { margin-top: 20px; padding: 18px 18px 20px; border-radius: 10px; background: var(--guac); color: #fff; }
.rw__k { font: 800 12px/1 var(--f-display); font-stretch: 80%; letter-spacing: 0.12em; text-transform: uppercase; color: var(--lime); }
.rw__t { margin: 6px 0 6px; font: 900 30px/1 var(--f-display); font-stretch: 72%; text-transform: uppercase; }
.rw__d { font-size: 13.5px; color: rgba(255, 255, 255, 0.88); }
.rw__act { display: flex; align-items: center; gap: 16px; margin-top: 14px; }
.rw__join { background: var(--lime); color: var(--on-lime); padding: 11px 20px; border-radius: 3px; text-decoration: none; font: 900 15px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.05em; }
.rw__join:hover { background: #fff; color: var(--guac); }
.rw__learn { color: #fff; font: 800 12px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.1em; text-underline-offset: 4px; }

.sheet__foot { padding: 14px var(--gut-r) calc(14px + env(safe-area-inset-bottom, 0px)) var(--gut-l); border-top: 1px solid var(--line); background: #fff; }
.cta { width: 100%; min-height: 52px; border: 0; border-radius: 3px; background: var(--ink); color: #fff; font: 900 18px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.04em; cursor: pointer; }
.cta:hover { background: var(--guac); }
.empty .cta { width: auto; padding: 0 24px; }
</style>
