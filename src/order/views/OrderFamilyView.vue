<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { calLabel, categories, findItem } from '@/order/lib/catalog'
import { cents, validate } from '@/order/lib/pricing'
import { useOrder } from '@/order/useOrder'
import { useBagSheet } from '@/order/useBagSheet'
import { useToast } from '@/composables/useToast'
import BuildCard from '@/order/components/BuildCard.vue'
import MealNameDialog from '@/order/components/MealNameDialog.vue'

// Family meals, following chipotle.com/order/build/family-meals:
// 1. /order/:store/family — "PICK YOUR FAMILY MEALS": one tall card per kit (photo, serves 4–6,
//    cal | price, what's in it). ADD TO BAG adds the kit as described (default proteins, rice and
//    beans); CUSTOMIZE opens step 2.
// 2. /order/:store/family/:slug — "BUILD YOUR TACO KIT": Protein | choose two, Rice | choose one,
//    Beans | choose one, Included (ticked, fixed), Add-ons (large dips, side cups), then YOUR MEAL
//    + ADD TO BAG. Both end with "Who's this meal for?" and the bag drawer.
const props = defineProps({
  store: { type: String, required: true },
  slug: { type: String, default: '' },
})
const route = useRoute()
const router = useRouter()
const order = useOrder()
const toast = useToast()
const bag = useBagSheet()

const HERO = '/media/family-kit.webp'
// One family-kit photo for now: each card zooms in on the part that fits the kit (tacos, chips & dips,
// burritos/quesadillas). Swap in per-kit photos when the owner has them.
const FOCUS = { 'taco-kit': '58% 92%', 'nacho-kit': '55% 8%', 'fajita-kit': '4% 62%' }
const kits = categories.find((c) => c.slug === 'family-kits').items.map((i) => findItem(i.slug))
const kit = computed(() => (props.slug ? kits.find((k) => k.slug === props.slug) ?? null : null))
watch(
  () => props.slug,
  (slug) => slug && !kits.some((k) => k.slug === slug) && router.replace(`/order/${props.store}/family`),
  { immediate: true },
)

// What comes in each kit, as photo cards. Rice and beans become choices where the kit has them.
const ART = [
  [/tortilla/i, '/media/sides/tortilla.webp'],
  [/pico/i, '/media/build/top-pico.webp'],
  [/^salsa$/i, '/media/build/top-red-salsa.webp'],
  [/lettuce/i, '/media/build/top-lettuce.webp'],
  [/cheese/i, '/media/build/top-cheese.webp'],
  [/sour cream/i, '/media/build/top-sour-cream.webp'],
  [/^chips$/i, '/media/sides/chips.webp'],
  [/queso/i, '/media/build/add-queso.webp'],
  [/jalape/i, '/media/build/top-jalapeno.webp'],
  [/fajita/i, '/media/build/protein-veggie-fajita.webp'],
  [/guac/i, '/media/build/add-guac.webp'],
  [/rice/i, '/media/build/rice-mexican.webp'],
  [/beans/i, '/media/build/beans-black.webp'],
]
const artFor = (name) => ART.find(([re]) => re.test(name))?.[1] ?? ''
const hasGroup = (k, key) => k.groups.some((g) => g.key === key)
const included = (k) =>
  k.includes
    .filter((n) => !(n === 'Rice' && hasGroup(k, 'kitRice')) && !(n === 'Beans' && hasGroup(k, 'kitBeans')))
    .map((n) => ({ name: n.charAt(0).toUpperCase() + n.slice(1), image: artFor(n) }))
const defaults = (k, key) => k.groups.find((g) => g.key === key)?.options.filter((o) => o.isDefault).map((o) => o.name) ?? []
const describe = (k) =>
  [defaults(k, 'kitProteins').join(' & '), ...defaults(k, 'kitRice'), ...defaults(k, 'kitBeans'), ...included(k).map((i) => i.name)].filter(Boolean).join(', ') + '.'
const meta = (k) => [calLabel(k), cents(k.basePriceCents)].filter(Boolean)

// --- Step 1: ADD TO BAG with the kit as described ----------------------------------------------------
const naming = ref(false)
const pending = ref(null) // kit slug being added from the picker
function addAsIs(k) {
  pending.value = k.slug
  naming.value = true
}

// --- Step 2: customize -------------------------------------------------------------------------------
const editLine = computed(() => order.state.lines.find((l) => l.id === route.query.edit) ?? null)
watch(
  () => [props.slug, route.query.edit],
  () => kit.value && order.openDraft(kit.value.slug, editLine.value),
  { immediate: true },
)
const draft = computed(() => (kit.value && order.state.draft?.itemSlug === kit.value.slug ? order.state.draft : null))
const sel = computed(() => draft.value?.selections ?? {})
const picksOf = (key) => sel.value[key] ?? []
const isPicked = (key, name) => picksOf(key).some((p) => p.name === name)
const atCap = (g) => g.maxSelect > 1 && picksOf(g.key).length >= g.maxSelect
const LABEL = { kitProteins: 'Protein', kitRice: 'Rice', kitBeans: 'Beans' }
const WORDS = { 1: 'one', 2: 'two', 3: 'three' }
const titleOf = (g) => `${LABEL[g.key] ?? g.name} | ${g.minSelect === g.maxSelect ? 'Choose' : 'Up to'} ${WORDS[g.maxSelect] ?? g.maxSelect}`
const errors = computed(() => (kit.value ? validate(kit.value, sel.value) : []))
const showErrors = ref(false)
const errorFor = (key) => errors.value.find((e) => e.group === key)?.message ?? ''

// Add-ons go into the bag as their own items (large 8 oz dips at the dips menu price, side cups).
const ADDONS = [
  { slug: 'guacamole', size: '8 oz', name: 'Large Guacamole', image: '/media/build/add-guac.webp' },
  { slug: 'queso', size: '8 oz', name: 'Large Queso', image: '/media/build/add-queso.webp' },
  { slug: 'salsa', size: '8 oz', name: 'Large Salsa', image: '/media/build/top-red-salsa.webp' },
  { slug: 'side-cup-chicken' },
  { slug: 'side-cup-beef' },
].map((a) => {
  const item = findItem(a.slug)
  const size = a.size ? item.groups.find((g) => g.key === 'size').options.find((o) => o.name === a.size) : null
  return {
    slug: a.slug,
    name: a.name ?? item.name,
    note: a.size ? `${a.size} · serves the table` : '',
    image: a.image ?? item.image,
    cal: (a.size ? item.calMax : item.calMin) ?? null, // the board's range runs 4 oz -> 8 oz
    cents: size ? size.priceCents : item.basePriceCents,
    selections: size ? { size: [{ name: a.size, level: 'regular' }] } : {},
  }
})
const extraPicked = (slug) => (draft.value?.extras ?? []).some((x) => (x.slug ?? x) === slug)

const mealName = computed(() => (kit.value ? `${kit.value.name} - ${picksOf('kitProteins').map((p) => p.name).join(' & ') || 'choose 2 proteins'}` : ''))
function addCustom() {
  if (errors.value.length) {
    showErrors.value = true
    document.getElementById('sec-kitProteins')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }
  pending.value = null
  naming.value = true
}

async function confirmName(name) {
  let wasEdit = false
  if (pending.value) {
    order.addLine(pending.value, name) // from the picker: the kit with its default choices
  } else {
    wasEdit = !!draft.value?.editId
    order.setLabel(name)
    order.commitDraft()
  }
  naming.value = false
  pending.value = null
  toast.show(wasEdit ? 'Meal updated' : 'Added to your bag')
  await router.push(`/order/${props.store}`)
  bag.show()
}
</script>

<template>
  <div class="fm">
    <RouterLink to="/menu" class="back"><span aria-hidden="true">‹</span> Return to menu</RouterLink>

    <!-- Step 1: pick a family meal -->
    <template v-if="!kit">
      <header class="hero">
        <div class="hero__img"><img :src="HERO" alt="A Fresh Guacado family kit: chips and dips, tacos, quesadillas and burritos" width="900" height="600" /></div>
        <div class="hero__copy">
          <p class="hero__pre">Pick your</p>
          <h1 class="hero__t">Family kits</h1>
          <p class="hero__d">Feeds 4–6. Two proteins and all the fixings.</p>
        </div>
      </header>
      <ul class="kits">
        <li v-for="k in kits" :key="k.slug">
          <article class="kc">
            <span class="kc__img"><img :src="k.image" alt="" width="900" height="600" loading="lazy" decoding="async" :style="{ transformOrigin: FOCUS[k.slug] }" /></span>
            <div class="kc__body">
              <h2 class="kc__name">{{ k.name }}</h2>
              <p class="kc__serves">Serves 4–6 people</p>
              <p class="kc__meta"><span v-for="m in meta(k)" :key="m">{{ m }}</span></p>
              <p class="kc__text">{{ describe(k) }}</p>
              <div class="kc__act">
                <button type="button" class="kc__add" @click="addAsIs(k)">Add to bag<span class="sr-only">: {{ k.name }}</span></button>
                <RouterLink :to="`/order/${store}/family/${k.slug}`" class="kc__custom">Customize<span class="sr-only"> {{ k.name }}</span></RouterLink>
              </div>
            </div>
          </article>
        </li>
      </ul>
    </template>

    <!-- Step 2: customize one kit -->
    <template v-else-if="draft">
      <header class="hero">
        <div class="hero__img"><img :src="kit.image" :alt="kit.name" width="900" height="600" /></div>
        <div class="hero__copy">
          <p class="hero__pre">Build your</p>
          <h1 class="hero__t">{{ kit.name }}</h1>
          <p class="hero__d">Feeds 4–6. Choose two proteins<template v-if="hasGroup(kit, 'kitRice')">, your rice</template><template v-if="hasGroup(kit, 'kitBeans')"> and beans</template>; everything else comes with it. Add large dips and side cups for the table.</p>
          <p class="hero__meta"><span v-for="m in meta(kit)" :key="m">{{ m }}</span></p>
        </div>
      </header>

      <section v-for="g in kit.groups" :id="`sec-${g.key}`" :key="g.key" class="sec" :aria-labelledby="`h-${g.key}`">
        <h2 :id="`h-${g.key}`" class="sec__t">{{ titleOf(g) }}</h2>
        <p v-if="showErrors && errorFor(g.key)" class="sec__err" role="alert">{{ errorFor(g.key) }}</p>
        <ul class="grid">
          <BuildCard
            v-for="o in g.options"
            :key="o.name"
            :name="o.name"
            :image="o.image"
            :picked="isPicked(g.key, o.name)"
            :disabled="atCap(g)"
            @pick="order.pick(g.key, o.name)"
          />
        </ul>
        <p v-if="atCap(g)" class="sec__hint">That's two. Tap one to swap it out.</p>
      </section>

      <section class="sec" aria-labelledby="h-included">
        <h2 id="h-included" class="sec__t">Included</h2>
        <ul class="grid">
          <BuildCard v-for="i in included(kit)" :key="i.name" :name="i.name" :image="i.image" picked locked />
        </ul>
      </section>

      <section id="sec-addons" class="sec" aria-labelledby="h-addons">
        <h2 id="h-addons" class="sec__t">Add-ons</h2>
        <p class="sec__sub">Added to your bag on their own.</p>
        <ul class="grid">
          <BuildCard
            v-for="a in ADDONS"
            :key="a.slug"
            :name="a.name"
            :image="a.image"
            :note="a.note"
            :cal="a.cal"
            :price="cents(a.cents)"
            :picked="extraPicked(a.slug)"
            @pick="order.toggleExtra(a.slug, a.selections)"
          />
        </ul>
      </section>

      <div class="mbar">
        <div class="mbar__in">
          <div class="mbar__meal">
            <span class="mbar__k">Your meal</span>
            <span class="mbar__name">{{ mealName }}</span>
          </div>
          <button type="button" class="mbar__add" @click="addCustom">{{ draft.editId ? 'Update' : 'Add to bag' }}</button>
        </div>
      </div>
    </template>

    <MealNameDialog
      :open="naming"
      :initial="pending ? '' : draft?.label ?? ''"
      :editing="!pending && !!draft?.editId"
      @confirm="confirmName"
      @cancel="naming = false"
    />
  </div>
</template>

<style scoped>
.fm { max-width: 840px; margin: 0 auto; }
.back { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; color: var(--ink); text-decoration: none; font: 900 16px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.04em; }
.back span { font-size: 24px; }

.hero { display: grid; gap: 16px 40px; align-items: center; padding: 16px 0 32px; border-bottom: 1px solid #d6d1c6; }
@media (min-width: 700px) { .hero { grid-template-columns: minmax(0, 360px) 1fr; } }
.hero__img img { display: block; width: 100%; height: auto; aspect-ratio: 3 / 2; object-fit: cover; }
.hero__pre { font: 500 18px/1 var(--f-display); font-stretch: 85%; text-transform: uppercase; letter-spacing: 0.02em; color: var(--ink-muted); }
.hero__t { margin: 6px 0 14px; font: 900 clamp(44px, 7vw, 64px)/0.92 var(--f-display); font-stretch: 72%; text-transform: uppercase; }
.hero__d { max-width: 46ch; font-size: 15px; line-height: 1.55; }
.hero__meta { display: flex; flex-wrap: wrap; gap: 6px 0; margin-top: 12px; font-size: 15px; font-weight: 700; }
.hero__meta span + span::before, .kc__meta span + span::before { content: ''; display: inline-block; width: 1px; height: 14px; margin: 0 10px; vertical-align: -2px; background: var(--ink-muted); }

/* Step 1 cards (chipotle.com family meals cards) */
.kits { list-style: none; margin: 32px 0 0; padding: 0; display: grid; gap: 24px; }
@media (min-width: 640px) { .kits { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.kits > li { display: flex; }
.kc { display: flex; flex-direction: column; width: 100%; border: 1px solid #d6d1c6; background: #fff; }
.kc__img { display: block; overflow: hidden; }
.kc__img img { display: block; width: 100%; height: auto; aspect-ratio: 3 / 2; object-fit: cover; transform: scale(1.75); }
.kc__body { display: flex; flex-direction: column; gap: 4px; flex: 1; padding: 16px; }
.kc__name { font: 900 20px/1.05 var(--f-display); font-stretch: 76%; text-transform: uppercase; }
.kc__serves { font-size: 13px; font-weight: 700; color: var(--ink-muted); }
.kc__meta { display: flex; flex-wrap: wrap; margin-top: 2px; font-size: 16px; font-weight: 800; }
.kc__text { margin-top: 6px; font-size: 13.5px; line-height: 1.45; color: var(--ink-muted); }
.kc__act { display: grid; gap: 4px; margin-top: auto; padding-top: 16px; }
.kc__add { min-height: 44px; border: 0; border-radius: 3px; background: var(--ink); color: #fff; font: 900 15px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; }
.kc__add:hover { background: var(--guac); }
.kc__custom { display: block; padding: 12px; text-align: center; color: var(--ink); text-decoration: none; font: 900 13px/1 var(--f-display); font-stretch: 82%; text-transform: uppercase; letter-spacing: 0.05em; }
.kc__custom:hover { color: var(--accent-text); text-decoration: underline; text-underline-offset: 3px; }
.kc__add:focus-visible, .kc__custom:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

/* Step 2 sections */
.sec { padding: 36px 0 12px; }
.sec__t { margin-bottom: 18px; font: 900 clamp(26px, 4vw, 32px)/1 var(--f-display); font-stretch: 74%; text-transform: uppercase; }
.sec__sub { margin: -8px 0 16px; font-size: 14px; color: var(--ink-muted); }
.sec__err { margin: -6px 0 14px; font-weight: 700; color: var(--chili); }
.sec__hint { margin-top: 10px; font-size: 13px; color: var(--ink-muted); }
.grid { list-style: none; margin: 0; padding: 0; display: grid; gap: 24px; }
@media (min-width: 700px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 699px) { .grid { gap: 12px; } }

.mbar { position: fixed; inset: auto 0 0; z-index: 40; background: #f1f0ee; border-top: 1px solid #dedad2; padding-bottom: env(safe-area-inset-bottom, 0px); }
.mbar__in { display: flex; align-items: center; gap: 12px 24px; max-width: 1200px; margin: 0 auto; padding: 14px var(--gut-r) 14px var(--gut-l); }
.mbar__meal { display: grid; gap: 6px; min-width: 0; flex: 1; }
.mbar__k { font: 900 16px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.03em; }
.mbar__name { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mbar__add { flex: none; min-height: 50px; padding: 0 clamp(22px, 5vw, 72px); border: 0; border-radius: 3px; background: var(--ink); color: #fff; font: 900 18px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.04em; cursor: pointer; }
.mbar__add:hover { background: var(--guac); }
.mbar__add:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
@media (max-width: 520px) { .mbar__k { display: none; } .mbar__add { padding: 0 18px; font-size: 16px; } }
</style>
