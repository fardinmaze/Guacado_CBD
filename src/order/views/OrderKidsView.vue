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

// Kids meals: chipotle.com's kid's-meal flow, dressed like our Family Kit pages.
// 1. /order/:store/kids — "PICK YOUR KIDS MEALS": photo banner + a tall card per kids item
//    (photo, cal | price, what's in it). Every card has ADD TO BAG (the meal as described: default
//    drink and tortillas, plus the item's `preset` picks) and CUSTOMIZE.
// 2. /order/:store/kids/:slug — "BUILD YOUR ..." with the item's photo up top: Included (fixed),
//    Tortilla, Protein or veggie, Toppings | Choose two, Drink, Add-ons (kid-size sides and
//    desserts, added as their own items), then YOUR MEAL + ADD TO BAG -> name -> bag drawer.
const props = defineProps({
  store: { type: String, required: true },
  slug: { type: String, default: '' },
})
const route = useRoute()
const router = useRouter()
const order = useOrder()
const toast = useToast()
const bag = useBagSheet()

const HERO = '/media/menu/kids-meal.webp'
const meals = categories.find((c) => c.slug === 'kids').items.map((i) => findItem(i.slug))
const meal = computed(() => (props.slug ? meals.find((m) => m.slug === props.slug) ?? null : null))
watch(
  () => props.slug,
  (slug) => slug && !meals.some((m) => m.slug === slug) && router.replace(`/order/${props.store}/kids`),
  { immediate: true },
)
const meta = (m) => [calLabel(m), cents(m.basePriceCents)].filter(Boolean)
const drinks = (m) => m.groups.find((g) => g.key === 'drink')?.options.map((o) => o.name).join(' or ') ?? ''
const cardText = (m) => (m.description ? m.description : `${(m.includes ?? []).join(', ')}. Includes ${drinks(m).toLowerCase()}.`)
// What ADD TO BAG on the card puts in the bag, spelled out (like the Family Kit cards).
const defaultOf = (m, key) => m.preset?.[key] ?? m.groups.find((g) => g.key === key)?.options.filter((o) => o.isDefault).map((o) => o.label ?? o.name) ?? []
const asIsText = (m) => {
  const main = defaultOf(m, 'main')[0]
  const tops = defaultOf(m, 'toppings').map((t) => t.toLowerCase())
  const shell = defaultOf(m, 'shell')[0]
  const drink = defaultOf(m, 'drink')[0]
  const food = main ? `${main} with ${tops.join(' and ')}${shell ? `, ${shell.toLowerCase()}` : ''}` : (m.includes ?? []).join(', ')
  return `${food}${drink ? `, and ${drink.toLowerCase()}` : ''}.`
}

// Included items (fixed), shown ticked like the Family Kit page.
const INCLUDED_ART = { 'Cheese quesadilla': '/media/build/base-quesadilla.webp' }
const included = (m) => (m.includes ?? []).map((n) => ({ name: n.charAt(0).toUpperCase() + n.slice(1), image: INCLUDED_ART[n] ?? m.image }))

// Sections in chipotle.com's order: tortilla first, then protein, toppings, drink.
const ORDER = ['shell', 'main', 'toppings', 'drink']
const TITLE = { shell: 'Tortilla', main: 'Protein or veggie', toppings: 'Toppings | Choose two', drink: 'Drink | Choose one' }
const groups = computed(() => (meal.value ? [...meal.value.groups].sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key)) : []))

// Add-ons: kid-size sides and desserts, added to the bag as their own items (menu prices).
const ADDONS = ['chips', 'churros', 'plantains'].map((slug) => {
  const item = findItem(slug)
  return { slug, name: item.name, image: item.image ?? (slug === 'chips' ? '/media/sides/chips.webp' : ''), cal: item.calMin ?? null, cents: item.basePriceCents }
})

const editLine = computed(() => order.state.lines.find((l) => l.id === route.query.edit) ?? null)
watch(
  () => [props.slug, route.query.edit],
  () => meal.value && order.openDraft(meal.value.slug, editLine.value),
  { immediate: true },
)
const draft = computed(() => (meal.value && order.state.draft?.itemSlug === meal.value.slug ? order.state.draft : null))
const sel = computed(() => draft.value?.selections ?? {})
const picksOf = (key) => sel.value[key] ?? []
const isPicked = (key, name) => picksOf(key).some((p) => p.name === name)
const atCap = (g) => g.maxSelect > 1 && picksOf(g.key).length >= g.maxSelect
const extraPicked = (slug) => (draft.value?.extras ?? []).some((x) => (x.slug ?? x) === slug)
const errors = computed(() => (meal.value ? validate(meal.value, sel.value) : []))
const showErrors = ref(false)
const errorFor = (key) => errors.value.find((e) => e.group === key)?.message ?? ''

const hasMain = computed(() => !!meal.value?.groups.some((g) => g.key === 'main'))
const ready = computed(() => !hasMain.value || picksOf('main').length > 0)
const mealName = computed(() => (meal.value ? [meal.value.name, picksOf('main')[0]?.name].filter(Boolean).join(' - ') : ''))

// ADD TO BAG (from the picker as-is, or from the builder) -> "Who's this meal for?" -> bag drawer.
const naming = ref(false)
const pending = ref(null)
function addAsIs(m) {
  pending.value = m.slug
  naming.value = true
}
function add() {
  if (errors.value.length) {
    showErrors.value = true
    const first = groups.value.find((g) => errorFor(g.key))
    if (first) document.getElementById(`sec-${first.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }
  pending.value = null
  naming.value = true
}
async function confirmName(name) {
  let wasEdit = false
  if (pending.value) order.addLine(pending.value, name)
  else {
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
  <div class="km">
    <RouterLink to="/menu" class="back"><span aria-hidden="true">‹</span> Return to menu</RouterLink>

    <!-- Step 1: pick a kids meal -->
    <template v-if="!meal">
      <header class="hero">
        <div class="hero__img"><img :src="HERO" alt="A Fresh Guacado kids cheese quesadilla" width="360" height="270" /></div>
        <div class="hero__copy">
          <p class="hero__pre">Pick your</p>
          <h1 class="hero__t">Kids meals</h1>
          <p class="hero__d">Build your own or enjoy a cheese quesadilla, both with organic milk or water.</p>
        </div>
      </header>
      <ul class="kits">
        <li v-for="m in meals" :key="m.slug">
          <article class="kc">
            <span class="kc__img"><img :src="m.image" alt="" width="360" height="270" loading="lazy" decoding="async" /></span>
            <div class="kc__body">
              <h2 class="kc__name">{{ m.name }}</h2>
              <p class="kc__serves">Kids meal · drink included</p>
              <p class="kc__meta"><span v-for="x in meta(m)" :key="x">{{ x }}</span></p>
              <p class="kc__text">{{ asIsText(m) }}</p>
              <div class="kc__act">
                <button type="button" class="kc__add" @click="addAsIs(m)">Add to bag<span class="sr-only">: {{ m.name }}</span></button>
                <RouterLink :to="`/order/${store}/kids/${m.slug}`" class="kc__custom">Customize<span class="sr-only"> {{ m.name }}</span></RouterLink>
              </div>
            </div>
          </article>
        </li>
      </ul>
    </template>

    <!-- Step 2: build it, with the item's photo up top -->
    <template v-else-if="draft">
      <header class="hero">
        <div class="hero__img"><img :src="meal.image" :alt="meal.name" width="360" height="270" /></div>
        <div class="hero__copy">
          <p class="hero__pre">Build your</p>
          <h1 class="hero__t">{{ meal.name }}</h1>
          <p class="hero__d">{{ cardText(meal) }}</p>
          <p class="hero__meta"><span v-for="x in meta(meal)" :key="x">{{ x }}</span></p>
        </div>
      </header>

      <section v-if="included(meal).length" class="sec" aria-labelledby="h-included">
        <h2 id="h-included" class="sec__t">Included</h2>
        <ul class="grid">
          <BuildCard v-for="i in included(meal)" :key="i.name" :name="i.name" :image="i.image" picked locked />
        </ul>
      </section>

      <section v-for="g in groups" :id="`sec-${g.key}`" :key="g.key" class="sec" :aria-labelledby="`h-${g.key}`">
        <h2 :id="`h-${g.key}`" class="sec__t">{{ TITLE[g.key] ?? g.name }}</h2>
        <p v-if="showErrors && errorFor(g.key)" class="sec__err" role="alert">{{ errorFor(g.key) }}</p>
        <ul class="grid">
          <BuildCard
            v-for="o in g.options"
            :key="o.name"
            :name="o.label ?? o.name"
            :image="o.image"
            :picked="isPicked(g.key, o.name)"
            :disabled="atCap(g)"
            @pick="order.pick(g.key, o.name)"
          />
        </ul>
        <p v-if="atCap(g)" class="sec__hint">That's two. Tap one to swap it out.</p>
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
            :cal="a.cal"
            :price="cents(a.cents)"
            :picked="extraPicked(a.slug)"
            @pick="order.toggleExtra(a.slug)"
          />
        </ul>
      </section>

      <div class="mbar">
        <div class="mbar__in">
          <div class="mbar__meal">
            <span class="mbar__k">Your meal</span>
            <span class="mbar__name">{{ ready ? mealName : 'Select a protein or veggie to get started' }}</span>
          </div>
          <button type="button" class="mbar__add" @click="add">{{ draft.editId ? 'Update' : 'Add to bag' }}</button>
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
/* Same tone as the Family Kit pages (OrderFamilyView.vue). Kids photos are cut-outs, so they sit
   on a warm panel instead of being cropped. */
.km { max-width: 840px; margin: 0 auto; }
.back { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; color: var(--ink); text-decoration: none; font: 900 16px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.04em; }
.back span { font-size: 24px; }

.hero { display: grid; gap: 16px 40px; align-items: center; padding: 16px 0 32px; border-bottom: 1px solid #d6d1c6; }
@media (min-width: 700px) { .hero { grid-template-columns: minmax(0, 360px) 1fr; } }
.hero__img { position: relative; aspect-ratio: 3 / 2; background: var(--surface); }
.hero__img img { position: absolute; inset: 8%; width: 84%; height: 84%; object-fit: contain; filter: drop-shadow(0 14px 18px rgba(20, 35, 27, 0.2)); }
.hero__pre { font: 500 18px/1 var(--f-display); font-stretch: 85%; text-transform: uppercase; letter-spacing: 0.02em; color: var(--ink-muted); }
.hero__t { margin: 6px 0 14px; font: 900 clamp(40px, 6.5vw, 60px)/0.92 var(--f-display); font-stretch: 72%; text-transform: uppercase; }
.hero__d { max-width: 46ch; font-size: 15px; line-height: 1.55; }
.hero__meta { display: flex; flex-wrap: wrap; margin-top: 12px; font-size: 15px; font-weight: 700; }
.hero__meta span + span::before, .kc__meta span + span::before { content: ''; display: inline-block; width: 1px; height: 14px; margin: 0 10px; vertical-align: -2px; background: var(--ink-muted); }

/* Step 1 cards */
.kits { list-style: none; margin: 32px 0 0; padding: 0; display: grid; gap: 24px; }
@media (min-width: 640px) { .kits { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.kits > li { display: flex; }
.kc { display: flex; flex-direction: column; width: 100%; border: 1px solid #d6d1c6; background: #fff; }
.kc__img { position: relative; display: block; aspect-ratio: 3 / 2; background: var(--surface); }
.kc__img img { position: absolute; inset: 8%; width: 84%; height: 84%; object-fit: contain; filter: drop-shadow(0 12px 16px rgba(20, 35, 27, 0.2)); }
.kc__body { display: flex; flex-direction: column; gap: 4px; flex: 1; padding: 16px; }
.kc__name { font: 900 20px/1.05 var(--f-display); font-stretch: 76%; text-transform: uppercase; }
.kc__serves { font-size: 13px; font-weight: 700; color: var(--ink-muted); }
.kc__meta { display: flex; flex-wrap: wrap; margin-top: 2px; font-size: 16px; font-weight: 800; }
.kc__text { margin-top: 6px; font-size: 13.5px; line-height: 1.45; color: var(--ink-muted); }
.kc__act { display: grid; gap: 4px; margin-top: auto; padding-top: 16px; }
.kc__add { display: grid; place-items: center; min-height: 44px; border: 0; border-radius: 3px; background: var(--ink); color: #fff; text-decoration: none; font: 900 15px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; }
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
