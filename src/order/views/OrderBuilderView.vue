<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { calLabel, findItem } from '@/order/lib/catalog'
import { EXTRA_PROTEIN_CENTS, calories, cents, hasExtraProtein, isHalf, validate } from '@/order/lib/pricing'
import { useOrder } from '@/order/useOrder'
import { useToast } from '@/composables/useToast'
import BuildCard from '@/order/components/BuildCard.vue'
import MealExtras from '@/order/components/MealExtras.vue'

// Build your own, laid out like chipotle.com/order/build/burrito-bowl.
// 1. Choose a base (Bowl, Burrito...). Once chosen it is kept in the URL (?base=burrito) and the
//    base list is not shown again; "Change" in the hero brings it back. Menu tiles can link
//    straight to a base (go=build:burrito).
// 2. One page of portions: Protein or veggie, Rice, Beans, Top things off, Sauce, Finish. A sticky
//    row of tags scrolls the page to each portion and marks the done ones (no NEXT steps).
// Protein and rice take up to two picks: two picks are half and half (1/2 badge; two proteins
// cost the dearer one). Calories per ingredient are SAMPLE values (menu.seed.json).
const props = defineProps({ store: { type: String, required: true } })
const route = useRoute()
const router = useRouter()
const order = useOrder()
const toast = useToast()

const SLUG = 'build-your-own'
const item = findItem(SLUG)
const SECTIONS = [
  { key: 'protein', label: 'Protein', groups: ['protein'], title: 'Protein or veggie', sub: 'Choose up to two.' },
  { key: 'rice', label: 'Rice', groups: ['rice'], title: 'Rice', sub: 'Choose up to two.' },
  { key: 'beans', label: 'Beans', groups: ['beans'], title: 'Beans', sub: 'Choose up to two.' },
  { key: 'toppings', label: 'Toppings', groups: ['addons', 'toppings'], title: 'Top things off', sub: '' },
  { key: 'sauce', label: 'Sauce', groups: ['sauce'], title: 'Homemade sauce', sub: 'Choose up to two.' },
  { key: 'finish', label: 'Finish', groups: [], title: 'Finish your meal', sub: '' },
]
const PORTIONS = SECTIONS.slice(0, -1)

const editLine = computed(() => order.state.lines.find((l) => l.id === route.query.edit) ?? null)
watch(
  () => route.query.edit,
  () => order.openDraft(SLUG, editLine.value),
  { immediate: true },
)

const draft = computed(() => order.state.draft)
const sel = computed(() => draft.value?.selections ?? {})
const groupOf = (key) => item.groups.find((g) => g.key === key)
const picksOf = (key) => sel.value[key] ?? []
const isPicked = (key, name) => picksOf(key).some((p) => p.name === name)
const levelOf = (key, name) => picksOf(key).find((p) => p.name === name)?.level ?? 'regular'
const atCap = (key) => groupOf(key).maxSelect > 1 && picksOf(key).length >= groupOf(key).maxSelect
const cardsOf = (key) => groupOf(key).options.filter((o) => o.image) // Extra Protein = the Double card
const priceOf = (key, o) => (o.priceCents ? cents(o.priceCents) : '')
const LEVELS = [
  { value: 'light', label: 'Light' },
  { value: 'regular', label: 'Normal' },
  { value: 'extra', label: 'Extra' },
  { value: 'side', label: 'Side' },
]
const PROTEIN_LEVELS = [
  { value: 'regular', label: 'Normal' },
  { value: 'extra', label: `Double +${cents(EXTRA_PROTEIN_CENTS)}` },
]
const levelsOf = (key) => (key === 'protein' ? PROTEIN_LEVELS : groupOf(key).allowLevels ? LEVELS : [])

// --- Base: chosen once, then hidden -----------------------------------------------------------
const toSlug = (name) => name.toLowerCase().replace(/[^a-z]+/g, '-')
const bases = groupOf('base').options
const baseFromQuery = computed(() => bases.find((o) => toSlug(o.name) === route.query.base) ?? null)
const changing = ref(false)
const baseChosen = computed(() => !changing.value && (!!baseFromQuery.value || !!draft.value?.editId))
watch(
  baseFromQuery,
  (o) => {
    if (o && draft.value && picksOf('base')[0]?.name !== o.name) order.pick('base', o.name)
  },
  { immediate: true },
)
const base = computed(() => bases.find((o) => o.name === picksOf('base')[0]?.name) ?? bases[0])
function chooseBase(o) {
  changing.value = false
  if (picksOf('base')[0]?.name !== o.name) order.pick('base', o.name)
  const { step, ...rest } = route.query
  router.replace({ query: { ...rest, base: toSlug(o.name) } })
  window.scrollTo({ top: 0, behavior: 'instant' })
}
function changeBase() {
  changing.value = true
  window.scrollTo({ top: 0, behavior: 'instant' })
}

// --- Picks ------------------------------------------------------------------------------------
function onLevel(key, name, lvl) {
  if (!isPicked(key, name)) order.pick(key, name)
  if (isPicked(key, name)) order.level(key, name, lvl)
}
const doubled = computed(() => hasExtraProtein(item, sel.value))
function toggleDouble() {
  if (doubled.value) {
    if (isPicked('addons', 'Extra Protein')) order.pick('addons', 'Extra Protein')
    picksOf('protein').forEach((p) => p.level === 'extra' && order.level('protein', p.name, 'regular'))
  } else order.pick('addons', 'Extra Protein')
}
const proteinNames = computed(() => picksOf('protein').map((p) => p.name))

// --- Totals, meal name, errors ----------------------------------------------------------------
const errors = computed(() => validate(item, sel.value))
const showErrors = ref(false)
const errorFor = (key) => errors.value.find((e) => e.group === key)?.message ?? ''
const sectionError = (s) => s.groups.map(errorFor).find(Boolean) ?? ''
const done = (s) => s.groups.length > 0 && !sectionError(s) && s.groups.some((k) => picksOf(k).length)
const ready = computed(() => picksOf('protein').length > 0)
const unit = computed(() => order.draftUnit.value * (draft.value?.qty ?? 1))
const cal = computed(() => calories(item, sel.value))
const mealName = computed(() => draft.value?.label?.trim() || [proteinNames.value.join(' & '), base.value.name].filter(Boolean).join(' '))

// --- Tags: scroll to a portion; the one on screen is highlighted ------------------------------
const active = ref(SECTIONS[0].key)
const tagsEl = ref(null)
const el = (key) => document.getElementById(`sec-${key}`)
let lockUntil = 0
function jump(key, smooth = true) {
  const target = el(key)
  active.value = key
  lockUntil = Date.now() + 900 // ignore the scroll spy while the page glides there
  if (target) {
    const offset = 65 + (tagsEl.value?.offsetHeight ?? 60) + 12
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: smooth ? 'smooth' : 'instant' })
  }
  if (route.query.step !== key) router.replace({ query: { ...route.query, step: key } })
}
// Keep the active tag in view inside the (sideways-scrolling) tag row. This scrolls only the row:
// scrollIntoView here would also touch the page and cancel the smooth scroll to the section.
watch(active, async (key) => {
  await nextTick()
  const row = tagsEl.value?.querySelector('.tags__row')
  const tag = row?.querySelector(`[data-key="${key}"]`)
  if (row && tag && row.scrollTo) row.scrollTo({ left: tag.offsetLeft - (row.clientWidth - tag.offsetWidth) / 2, behavior: 'smooth' })
})
let spy
function watchSections() {
  spy?.disconnect()
  if (!('IntersectionObserver' in window)) return
  spy = new IntersectionObserver(
    (entries) => {
      if (Date.now() < lockUntil) return
      const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (hit) active.value = hit.target.dataset.key
    },
    { rootMargin: '-30% 0px -60% 0px' },
  )
  SECTIONS.forEach((s) => el(s.key) && spy.observe(el(s.key)))
}
watch(baseChosen, async (on) => {
  await nextTick()
  if (on) watchSections()
})
onMounted(async () => {
  await nextTick()
  if (!baseChosen.value) return
  watchSections()
  if (SECTIONS.some((s) => s.key === route.query.step)) jump(route.query.step, false)
})
onBeforeUnmount(() => spy?.disconnect())

function add() {
  if (errors.value.length) {
    showErrors.value = true
    const first = SECTIONS.find((s) => sectionError(s))
    if (first) jump(first.key)
    return
  }
  const wasEdit = !!draft.value.editId
  order.commitDraft()
  toast.show(wasEdit ? 'Meal updated' : 'Added to your bag')
  router.push(`/order/${props.store}`)
}
</script>

<template>
  <div v-if="draft" class="bd">
    <RouterLink :to="`/order/${store}`" class="back"><span aria-hidden="true">‹</span> Return to menu</RouterLink>

    <!-- Step 1: choose the base. Hidden for good once one is chosen. -->
    <template v-if="!baseChosen">
      <header class="hero hero--pick">
        <div class="hero__copy">
          <p class="hero__pre">Build your own</p>
          <h1 class="hero__t">Choose your meal</h1>
          <p class="hero__d">{{ item.description }}</p>
          <p class="hero__meta">{{ calLabel(item) }}</p>
        </div>
      </header>
      <section class="sec" aria-labelledby="h-base">
        <div class="sec__head"><h2 id="h-base" class="sec__t">Base</h2><p class="sec__sub">Choose one to start building.</p></div>
        <ul class="grid">
          <BuildCard
            v-for="o in bases"
            :key="o.name"
            :name="o.name"
            :image="o.image"
            :cal="o.cal"
            :picked="!!draft.editId && base.name === o.name"
            @pick="chooseBase(o)"
          />
        </ul>
      </section>
    </template>

    <template v-else>
      <header class="hero">
        <div class="hero__img"><img :src="base.image" :alt="base.name" width="360" height="360" /></div>
        <div class="hero__copy">
          <p class="hero__pre">Build your</p>
          <h1 class="hero__t">{{ base.name }}</h1>
          <p class="hero__d">{{ item.description }}</p>
          <p class="hero__meta">
            <span>{{ calLabel(item) }}</span>
            <button type="button" class="hero__change" @click="changeBase">Change<span class="sr-only"> base</span></button>
          </p>
        </div>
      </header>

      <nav ref="tagsEl" class="tags" aria-label="Meal portions">
        <ul class="tags__row">
          <li v-for="s in SECTIONS" :key="s.key">
            <button
              type="button"
              class="tag"
              :data-key="s.key"
              :class="{ on: active === s.key, done: done(s), err: showErrors && sectionError(s) }"
              :aria-current="active === s.key ? 'true' : null"
              @click="jump(s.key)"
            >
              <span class="tag__ic" aria-hidden="true">
                <svg v-if="done(s)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10" /></svg>
              </span>
              {{ s.label }}<span v-if="done(s)" class="sr-only"> (done)</span>
            </button>
          </li>
        </ul>
      </nav>

      <section v-for="s in PORTIONS" :id="`sec-${s.key}`" :key="s.key" :data-key="s.key" class="sec" :aria-labelledby="`h-${s.key}`">
        <div class="sec__head">
          <h2 :id="`h-${s.key}`" class="sec__t">{{ s.title }}</h2>
          <p v-if="s.sub" class="sec__sub">{{ s.sub }}</p>
        </div>
        <p v-if="showErrors && sectionError(s)" class="sec__err" role="alert">{{ sectionError(s) }}</p>
        <ul class="grid">
          <template v-for="k in s.groups" :key="k">
            <BuildCard
              v-for="o in cardsOf(k)"
              :key="o.name"
              :name="o.name"
              :image="o.image"
              :note="o.note"
              :cal="o.cal"
              :price="priceOf(k, o)"
              :picked="isPicked(k, o.name)"
              :half="isPicked(k, o.name) && isHalf(groupOf(k), sel)"
              :disabled="atCap(k)"
              :levels="levelsOf(k)"
              :level="levelOf(k, o.name)"
              @pick="order.pick(k, o.name)"
              @level="onLevel(k, o.name, $event)"
            />
          </template>
          <BuildCard
            v-if="s.key === 'rice' || s.key === 'beans'"
            :name="`No ${s.title}`"
            :cal="0"
            none
            :picked="!picksOf(s.key).length"
            @pick="order.clear(s.key)"
          />
          <BuildCard
            v-if="s.key === 'protein' && proteinNames.length"
            class="dbl"
            name="Double your protein"
            :image="cardsOf('protein').find((o) => o.name === proteinNames[0])?.image"
            :note="`Double portion of ${proteinNames.join(' and ')}`"
            :price="`+ ${cents(EXTRA_PROTEIN_CENTS)}`"
            :picked="doubled"
            @pick="toggleDouble"
          />
        </ul>
        <p v-if="s.groups.some(atCap) && s.key !== 'toppings'" class="sec__hint">That's two. Tap one to swap it out.</p>
      </section>

      <section id="sec-finish" data-key="finish" class="sec" aria-labelledby="h-finish">
        <div class="sec__head"><h2 id="h-finish" class="sec__t">Finish your meal</h2></div>
        <ul class="sum">
          <li v-for="s in PORTIONS" :key="s.key">
            <span class="sum__k">{{ s.label }}</span>
            <span class="sum__v">{{ s.groups.flatMap((k) => picksOf(k).filter((p) => p.name !== 'Extra Protein').map((p) => (isHalf(groupOf(k), sel) ? '½ ' : '') + p.name + (p.level && p.level !== 'regular' ? ` (${p.level})` : ''))).join(', ') || 'None' }}</span>
            <button type="button" class="sum__edit" @click="jump(s.key)">Edit<span class="sr-only"> {{ s.label }}</span></button>
          </li>
        </ul>
        <MealExtras class="fin" :label="draft.label" :qty="draft.qty" @update:label="order.setLabel" @update:qty="order.setQty" />
      </section>

      <!-- Bottom bar, chipotle.com style: YOUR MEAL + meal name, price, ADD TO BAG. -->
      <div class="mbar">
        <div class="mbar__in">
          <div class="mbar__meal">
            <span class="mbar__k">Your meal</span>
            <span class="mbar__name">{{ ready ? mealName : 'Select a protein or veggie to get started' }}</span>
          </div>
          <p v-if="ready" class="mbar__price" aria-live="polite" aria-atomic="true">
            <strong>{{ cents(unit) }}</strong><span>{{ cal.toLocaleString('en-US') }} cal</span>
          </p>
          <button type="button" class="mbar__add" @click="add">{{ draft.editId ? 'Update' : 'Add to bag' }}</button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.bd { max-width: 840px; margin: 0 auto; }
.back { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; color: var(--ink); text-decoration: none; font: 900 16px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.04em; }
.back span { font-size: 24px; }

/* Hero: photo left, "BUILD YOUR" + big base name + description right, rule underneath. */
.hero { display: grid; gap: 12px 40px; align-items: center; padding: 16px 0 32px; border-bottom: 1px solid #d6d1c6; }
@media (min-width: 700px) { .hero { grid-template-columns: minmax(0, 320px) 1fr; } .hero--pick { grid-template-columns: 1fr; } }
.hero__img { display: grid; place-items: center; }
.hero__img img { width: min(100%, 320px); height: auto; aspect-ratio: 1; object-fit: contain; }
.hero__pre { font: 500 18px/1 var(--f-display); font-stretch: 85%; text-transform: uppercase; letter-spacing: 0.02em; color: var(--ink-muted); }
.hero__t { margin: 6px 0 14px; font: 900 clamp(44px, 7vw, 64px)/0.92 var(--f-display); font-stretch: 72%; text-transform: uppercase; }
.hero__d { max-width: 46ch; font-size: 15px; line-height: 1.55; }
.hero__meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 18px; margin-top: 12px; font-size: 14px; font-weight: 700; color: var(--ink-muted); }
.hero__change { min-height: 40px; padding: 0; border: 0; background: none; color: var(--accent-text); font: 900 14px/1 var(--f-display); font-stretch: 85%; text-transform: uppercase; letter-spacing: 0.06em; text-decoration: underline; text-underline-offset: 4px; cursor: pointer; }

/* Tags: sticky under the order header; scroll sideways on phones. */
.tags { position: sticky; top: calc(65px + env(safe-area-inset-top, 0px)); z-index: 30; margin: 0 calc(-1 * var(--gut-r)) 0 calc(-1 * var(--gut-l)); background: rgba(255, 255, 255, 0.97); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
.tags__row { list-style: none; margin: 0; padding: 10px var(--gut-r) 10px var(--gut-l); display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; }
.tags__row::-webkit-scrollbar { display: none; }
.tag { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 16px 0 10px; border: 1.5px solid var(--line); border-radius: 999px; background: #fff; color: var(--ink); font: 800 14px/1 var(--f-display); font-stretch: 85%; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; cursor: pointer; transition: background-color 0.15s, border-color 0.15s, color 0.15s; }
.tag:hover { border-color: var(--ink); }
.tag:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.tag__ic { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid var(--line); display: grid; place-items: center; }
.tag__ic svg { width: 11px; height: 11px; }
.tag.done .tag__ic { background: var(--guac); border-color: var(--guac); color: #fff; }
.tag.on { background: var(--ink); border-color: var(--ink); color: #fff; }
.tag.on.done .tag__ic { background: var(--lime); border-color: var(--lime); color: var(--on-lime); }
.tag.err { border-color: var(--chili); color: var(--chili); }

/* Portions */
.sec { padding: 36px 0 12px; }
.sec__head { margin-bottom: 18px; }
.sec__t { font: 900 clamp(28px, 4vw, 34px)/1 var(--f-display); font-stretch: 74%; text-transform: uppercase; }
.sec__sub { margin-top: 10px; font-size: 14px; color: var(--ink-muted); }
.sec__err { margin: -6px 0 14px; font-weight: 700; color: var(--chili); }
.sec__hint { margin-top: 10px; font-size: 13px; color: var(--ink-muted); }
.grid { list-style: none; margin: 0; padding: 0; display: grid; gap: 24px; }
@media (min-width: 700px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 699px) { .grid { gap: 12px; } }
.dbl :deep(.bc__btn) { background: #f1eee7; }

/* Finish */
.sum { list-style: none; margin: 0 0 24px; padding: 0; border: 1px solid #d6d1c6; }
.sum li { display: grid; grid-template-columns: 90px 1fr auto; align-items: center; gap: 12px; padding: 10px 8px 10px 16px; border-top: 1px solid var(--line); }
.sum li:first-child { border-top: 0; }
.sum__k { font: 800 13px/1 var(--f-display); font-stretch: 85%; text-transform: uppercase; letter-spacing: 0.06em; color: var(--accent-text); }
.sum__v { font-weight: 700; font-size: 14px; }
.sum__edit { min-height: 40px; padding: 0 10px; border: 0; background: none; color: var(--ink); font: 700 14px var(--f-body); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.fin { max-width: 520px; }

/* Bottom bar */
.mbar { position: fixed; inset: auto 0 0; z-index: 40; background: #f1f0ee; border-top: 1px solid #dedad2; padding-bottom: env(safe-area-inset-bottom, 0px); }
.mbar__in { display: flex; align-items: center; gap: 12px 24px; max-width: 1200px; margin: 0 auto; padding: 14px var(--gut-r) 14px var(--gut-l); }
.mbar__meal { display: grid; gap: 6px; min-width: 0; flex: 1; }
.mbar__k { font: 900 16px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.03em; }
.mbar__name { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mbar__price { display: grid; justify-items: end; gap: 2px; margin: 0; }
.mbar__price strong { font: 900 22px/1 var(--f-display); font-stretch: 80%; }
.mbar__price span { font-size: 12px; font-weight: 700; color: var(--ink-muted); }
.mbar__add { flex: none; min-height: 50px; padding: 0 clamp(22px, 5vw, 72px); border: 0; border-radius: 3px; background: var(--ink); color: #fff; font: 900 18px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.04em; cursor: pointer; }
.mbar__add:hover { background: var(--guac); }
.mbar__add:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
@media (max-width: 520px) { .mbar__k { display: none; } .mbar__add { padding: 0 18px; font-size: 16px; } }
@media (prefers-reduced-motion: reduce) { .tag { transition: none; } }
</style>
