<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { stores, isOrderable } from '@/order/lib/catalog'
import { useOrder } from '@/order/useOrder'
import { useLocationPicker } from '@/composables/useLocationPicker'
import { site } from '@/data/site'

// Location picker modal, like chipotle.com's "Pickup from": Pickup / Delivery tabs, a City, State
// or ZIP search that lists nearby restaurants, and a map of the highlighted one. Choosing a
// restaurant remembers it and opens its order menu, so every order starts with a location.
// Delivery goes through our online ordering partner. The map is a Google Maps embed of the store
// address only; what the guest types is never sent anywhere.
const { open, tab, hide } = useLocationPicker()
const order = useOrder()
const router = useRouter()
const query = ref('')
const input = ref(null)
const root = ref(null)
const focusSlug = ref('')

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const results = computed(() => {
  const q = query.value.trim()
  const list = stores.map((s) => ({ ...s, open: isOrderable(s) }))
  if (!q) return list
  const zip = /^\d{3,5}$/.test(q) ? Number(q.padEnd(5, '0')) : null
  if (zip !== null) return [...list].sort((a, b) => Math.abs(Number(a.zip) - zip) - Math.abs(Number(b.zip) - zip)).slice(0, 8)
  const n = norm(q)
  return list.filter((s) => norm(`${s.address} ${s.city} ${s.state} ${s.zip}`).includes(n) || norm(s.city).startsWith(n))
})
const focused = computed(() => results.value.find((s) => s.slug === focusSlug.value) ?? results.value[0] ?? null)
const mapSrc = computed(() => {
  const s = focused.value
  return s ? `https://maps.google.com/maps?q=${encodeURIComponent(`${s.address}, ${s.city}, ${s.state} ${s.zip}`)}&z=14&output=embed` : ''
})

function choose(s) {
  if (!s.open || !order.chooseStore(s.slug)) return
  hide()
  router.push(`/order/${s.slug}`)
}

function onKey(e) {
  if (e.key === 'Escape') hide()
}
watch(open, async (on) => {
  document.body.style.overflow = on ? 'hidden' : ''
  if (on) {
    document.addEventListener('keydown', onKey)
    focusSlug.value = order.state.storeSlug ?? ''
    await nextTick()
    input.value?.focus()
  } else document.removeEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="lp" @click.self="hide">
      <div ref="root" class="lp__box" role="dialog" aria-modal="true" aria-labelledby="lp-t">
        <div class="lp__side">
          <div class="lp__top">
            <h2 id="lp-t" class="lp__t">Where are we eating?</h2>
            <button type="button" class="lp__x" aria-label="Close" @click="hide">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <div class="lp__tabs" role="tablist" aria-label="Pickup or delivery">
            <button type="button" role="tab" class="lp__tab" :aria-selected="tab === 'pickup'" @click="tab = 'pickup'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M6 8h12l1 12H5L6 8z" /><path d="M9 10V7a3 3 0 0 1 6 0v3" /></svg>
              Pickup
            </button>
            <button type="button" role="tab" class="lp__tab" :aria-selected="tab === 'delivery'" @click="tab = 'delivery'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="17" r="2.5" /><circle cx="18" cy="17" r="2.5" /><path d="M8.5 17h7M3 12h8l3-5h3l3 7" /></svg>
              Delivery
            </button>
          </div>

          <template v-if="tab === 'pickup'">
            <label class="lp__search">
              <span class="sr-only">Search by city, state or ZIP</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
              <input ref="input" v-model="query" type="search" placeholder="Search City, State or ZIP" autocomplete="postal-code" />
            </label>
            <p class="lp__count" role="status">{{ results.length }} {{ query ? 'nearby' : '' }} restaurant{{ results.length === 1 ? '' : 's' }}</p>
            <ul class="lp__list">
              <li v-for="s in results" :key="s.slug" class="lp__item" :class="{ on: focused?.slug === s.slug }" @mouseenter="focusSlug = s.slug">
                <button type="button" class="lp__pick" :disabled="!s.open" @click="choose(s)" @focus="focusSlug = s.slug">
                  <span class="lp__addr"><b>{{ s.address }}</b><span>{{ s.city }}, {{ s.state }} {{ s.zip }}</span></span>
                  <span v-if="s.open" class="lp__open">Open daily · 10:30am–3am</span>
                  <span v-else class="lp__soon">Coming soon</span>
                </button>
                <button v-if="s.open" type="button" class="lp__go" @click="choose(s)">Order here<span class="sr-only"> at {{ s.address }}</span></button>
              </li>
            </ul>
            <p v-if="!results.length" class="lp__empty">No restaurants match "{{ query }}". Try a city, state (like NY) or ZIP.</p>
          </template>

          <div v-else class="lp__del">
            <p>Delivery is handled by our online ordering partner. Enter your address there and we'll bring it to you.</p>
            <a :href="site.orderUrl" class="lp__go lp__go--wide" target="_blank" rel="noopener">Order delivery<span class="sr-only"> (opens in a new tab)</span></a>
          </div>
        </div>

        <div class="lp__map">
          <iframe v-if="mapSrc" :key="mapSrc" :src="mapSrc" :title="`Map of ${focused.address}`" loading="lazy" referrerpolicy="no-referrer-when-downgrade" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.lp { position: fixed; inset: 0; z-index: 95; display: grid; place-items: center; padding: 16px; background: rgba(0, 0, 0, 0.55); }
.lp__box { display: grid; width: min(100%, 1040px); height: min(100%, 680px); background: #fff; border-radius: 6px; overflow: hidden; box-shadow: 0 24px 60px -20px rgba(0, 0, 0, 0.5); }
@media (min-width: 820px) { .lp__box { grid-template-columns: 420px 1fr; } }
@media (max-width: 819px) { .lp__box { grid-template-rows: 1fr 200px; height: 100%; } .lp { padding: 0; } .lp__box { border-radius: 0; } }
.lp__side { display: flex; flex-direction: column; min-height: 0; padding: 20px 20px 0; }
.lp__top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.lp__t { font: 900 28px/1 var(--f-display); font-stretch: 74%; text-transform: uppercase; }
.lp__x { width: 40px; height: 40px; border: 1.5px solid var(--line); border-radius: 50%; background: #fff; display: grid; place-items: center; cursor: pointer; }
.lp__x svg { width: 18px; height: 18px; }
.lp__tabs { display: flex; gap: 22px; margin: 16px 0 12px; border-bottom: 1px solid var(--line); }
.lp__tab { display: inline-flex; align-items: center; gap: 8px; padding: 10px 2px; border: 0; border-bottom: 3px solid transparent; background: none; color: var(--ink-muted); font: 900 16px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.04em; cursor: pointer; }
.lp__tab svg { width: 20px; height: 20px; }
.lp__tab[aria-selected='true'] { color: var(--ink); border-bottom-color: var(--guac); }
.lp__search { position: relative; display: block; }
.lp__search svg { position: absolute; left: 14px; top: 50%; width: 18px; height: 18px; transform: translateY(-50%); color: var(--ink-muted); }
.lp__search input { width: 100%; min-height: 48px; padding: 0 14px 0 42px; border: 1.5px solid #c8bfb0; border-radius: 4px; font: 600 16px var(--f-body); color: var(--ink); }
.lp__search input:focus-visible { outline: 3px solid var(--focus); outline-offset: 1px; }
.lp__count { margin: 10px 0 6px; font-size: 13px; color: var(--ink-muted); }
.lp__list { list-style: none; margin: 0; padding: 0 0 16px; overflow-y: auto; flex: 1; }
.lp__item { display: flex; align-items: center; gap: 10px; padding: 12px 8px; border-bottom: 1px solid var(--line); border-left: 3px solid transparent; }
.lp__item.on { background: var(--surface); border-left-color: var(--guac); }
.lp__pick { flex: 1; display: grid; gap: 4px; padding: 0; border: 0; background: none; color: var(--ink); text-align: left; cursor: pointer; }
.lp__pick:disabled { cursor: default; opacity: 0.6; }
.lp__addr { display: grid; gap: 2px; }
.lp__addr span { font-size: 13px; color: var(--ink-muted); }
.lp__open { font-size: 12px; font-weight: 700; color: var(--accent-text); }
.lp__soon { justify-self: start; padding: 3px 8px; border-radius: 999px; background: var(--chili); color: #fff; font: 800 11px/1 var(--f-display); text-transform: uppercase; }
.lp__go { flex: none; display: inline-grid; place-items: center; min-height: 40px; padding: 0 16px; border: 0; border-radius: 3px; background: var(--guac); color: #fff; text-decoration: none; font: 900 14px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.04em; cursor: pointer; }
.lp__go:hover { background: var(--guac-dark); }
.lp__go--wide { width: 100%; min-height: 50px; font-size: 17px; }
.lp__go:focus-visible, .lp__pick:focus-visible, .lp__tab:focus-visible, .lp__x:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.lp__empty { padding: 12px 0; color: var(--ink-muted); font-size: 14px; }
.lp__del { display: grid; gap: 16px; padding: 12px 0; font-size: 15px; line-height: 1.5; }
.lp__map { background: var(--surface); }
.lp__map iframe { width: 100%; height: 100%; border: 0; display: block; }
</style>
