<script setup>
import { computed, reactive, watch } from 'vue'
import { categories, findItem } from '@/order/lib/catalog'
import { cents } from '@/order/lib/pricing'
import { useOrder } from '@/order/useOrder'
import { useBagSheet } from '@/order/useBagSheet'
import { useToast } from '@/composables/useToast'
import badge from '@/assets/logos/guacado-badge.webp'
import StickyBar from '@/order/components/StickyBar.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

// /order/:store/drinks | sides | desserts — a whole menu shelf on one page, dressed like the
// Kids / Family Kit pickers: photo banner, then a photo card per item with its price and ADD TO BAG.
// Items with a choice (Jarritos flavor, Coke or Sprite, dip size) show it as chips on the card;
// a default choice (4 oz) starts picked, otherwise one must be picked before adding. Sized dips
// swap the card photo to the picked size. Guests stay on the page so they can add several.
const props = defineProps({
  store: { type: String, required: true },
  kind: { type: String, default: 'drinks' },
})
const order = useOrder()
const toast = useToast()
const { show: showBag } = useBagSheet()

const itemsOf = (slug) => categories.find((c) => c.slug === slug).items.map((i) => findItem(i.slug))
const PAGES = {
  drinks: {
    title: 'Drinks',
    text: 'Jarritos and glass-bottle Coke or Sprite, can soda, organic Tractor drinks, Red Bull, organic milk, shakes and water.',
    sections: [{ title: '', items: itemsOf('beverages') }],
    hero: ['bottle-drink', 'mexican-soda', 'organic-tractor-strawberry-dragon-fruit', 'red-bull'],
    kidsMilk: true,
  },
  sides: {
    title: 'Sides & dips',
    text: 'Chips, fries, rice and beans, cups of chicken or beef, and guac, queso or salsa to dip in.',
    sections: [
      { title: 'Sides', items: itemsOf('sides') },
      { title: 'Dips & chips', items: itemsOf('dips') },
    ],
    hero: ['chips-guac', 'nacho-cheese-fries', 'queso'],
  },
  desserts: {
    title: 'Desserts',
    text: 'Cinnamon-sugar churros, Oreo churros, tres leches cake and sweet fried plantains.',
    sections: [{ title: '', items: itemsOf('desserts') }],
    hero: ['churros', 'tres-leches-cake'],
  },
}
const page = computed(() => PAGES[props.kind] ?? PAGES.drinks)
const all = computed(() => page.value.sections.flatMap((x) => x.items))
const HERO = computed(() => page.value.hero.map((s) => all.value.find((d) => d.slug === s)?.image).filter(Boolean))

// Kids milk comes only with a kids meal, so its card points there instead of adding it alone.
const KIDS_MILK = { name: 'Organic Milk Kids', image: '/media/build/drink-kids-milk.webp' }

const choiceGroup = (d) => d.groups.find((g) => g.minSelect > 0) ?? null
const picked = reactive({}) // slug -> option name
const missing = reactive({}) // slug -> true when ADD was pressed without a choice
watch(all, (items) => items.forEach((d) => {
  const def = choiceGroup(d)?.options.find((o) => o.isDefault)
  if (def && !picked[d.slug]) picked[d.slug] = def.name
}), { immediate: true })
const pickedOption = (d) => choiceGroup(d)?.options.find((o) => o.name === picked[d.slug]) ?? null
const imageOf = (d) => pickedOption(d)?.image ?? d.image
// Sized dips are priced by the size: show the picked size's price (or "From" the cheapest).
const priceOf = (d) => {
  const g = choiceGroup(d)
  if (!g?.setsPrice) return cents(d.basePriceCents)
  const o = pickedOption(d)
  return o ? cents(o.priceCents) : `From ${cents(Math.min(...g.options.map((x) => x.priceCents)))}`
}
const chipPrice = (g, o) => (g.setsPrice ? '' : o.priceCents ? ` +${cents(o.priceCents)}` : '')
const blurb = (d) => d.description ?? (choiceGroup(d) && !choiceGroup(d).setsPrice ? `${choiceGroup(d).options.length} flavors to choose from.` : '')

function choose(d, name) {
  const g = choiceGroup(d)
  // a choice with a default (size) can't be cleared, only switched
  picked[d.slug] = picked[d.slug] === name && !g.options.some((o) => o.isDefault) ? undefined : name
  missing[d.slug] = false
}
function add(d) {
  const g = choiceGroup(d)
  if (g && !picked[d.slug]) {
    missing[d.slug] = true
    return
  }
  if (g) order.addLine(d.slug, '', { selections: { [g.key]: [{ name: picked[d.slug], level: 'regular' }] } })
  else order.quickAdd(d.slug)
  toast.show(`${g ? `${d.name} (${picked[d.slug]})` : d.name} added`)
}
</script>

<template>
  <div class="dk">
    <RouterLink to="/menu" class="back"><span aria-hidden="true">‹</span> Return to menu</RouterLink>

    <header class="hero">
      <div class="hero__img" :class="`hero__img--${kind}`" aria-hidden="true">
        <img v-for="(src, i) in HERO" :key="src" :src="src" alt="" width="360" height="360" :style="{ '--i': i }" />
      </div>
      <div class="hero__copy">
        <p class="hero__pre">Pick your</p>
        <h1 class="hero__t">{{ page.title }}</h1>
        <p class="hero__d">{{ page.text }}</p>
      </div>
    </header>

    <section v-for="sec in page.sections" :key="sec.title" class="shelf" :aria-label="sec.title || page.title">
    <h2 v-if="sec.title" class="shelf__t">{{ sec.title }}</h2>
    <ul class="grid">
      <li v-for="d in sec.items" :key="d.slug">
        <article class="dc" :class="{ 'is-missing': missing[d.slug] }">
          <span class="dc__img" :class="{ 'is-empty': !d.image }">
            <img :src="imageOf(d) || badge" alt="" width="360" height="360" loading="lazy" decoding="async" />
          </span>
          <div class="dc__body">
            <span class="dc__tag-slot"><span v-if="d.tag" class="dc__tag">{{ d.tag }}</span></span>
            <h3 class="dc__name">{{ d.name }}</h3>
            <p class="dc__price">{{ priceOf(d) }}</p>
            <p v-if="blurb(d)" class="dc__text">{{ blurb(d) }}</p>

            <fieldset v-if="choiceGroup(d)" class="dc__pick">
              <legend class="sr-only">{{ choiceGroup(d).name }} for {{ d.name }}</legend>
              <button
                v-for="o in choiceGroup(d).options"
                :key="o.name"
                type="button"
                class="chip"
                :aria-pressed="picked[d.slug] === o.name"
                @click="choose(d, o.name)"
              >{{ o.name }}{{ chipPrice(choiceGroup(d), o) }}</button>
            </fieldset>
            <p v-if="missing[d.slug]" class="dc__err" role="alert">Choose one first.</p>

            <button type="button" class="dc__add" @click="add(d)">Add to bag<span class="sr-only">: {{ d.name }}</span></button>
          </div>
        </article>
      </li>
      <li v-if="page.kidsMilk && sec === page.sections.at(-1)">
        <article class="dc">
          <span class="dc__img"><img :src="KIDS_MILK.image" alt="" width="360" height="360" loading="lazy" decoding="async" /></span>
          <div class="dc__body">
            <span class="dc__tag-slot"><span class="dc__tag dc__tag--kids">Kids meal only</span></span>
            <h3 class="dc__name">{{ KIDS_MILK.name }}</h3>
            <p class="dc__price">Included</p>
            <p class="dc__text">Comes with every kids meal, or swap it for water.</p>
            <RouterLink :to="`/order/${store}/kids`" class="dc__add dc__add--alt">See kids meals</RouterLink>
          </div>
        </article>
      </li>
    </ul>
    </section>

    <StickyBar v-if="order.count.value" :caption="`${order.count.value} in your bag`">
      <BaseButton variant="lime" @click="showBag">VIEW BAG</BaseButton>
    </StickyBar>
  </div>
</template>

<style scoped>
/* Same tone as the Kids / Family Kit pages. Drink photos are cut-outs on a warm panel. */
.dk { max-width: 980px; margin: 0 auto; padding-bottom: 40px; }
.back { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; color: var(--ink); text-decoration: none; font: 900 16px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.04em; }
.back span { font-size: 24px; }

.hero { display: grid; gap: 16px 40px; align-items: center; padding: 16px 0 32px; border-bottom: 1px solid #d6d1c6; }
@media (min-width: 700px) { .hero { grid-template-columns: minmax(0, 400px) 1fr; } }
/* four drinks fanned out on the banner panel */
.hero__img { display: flex; align-items: center; justify-content: center; aspect-ratio: 3 / 2; padding: 4% 0; background: var(--surface); overflow: hidden; }
/* the photos are square with side padding, so they overlap a little to sit as one group */
.hero__img img { flex: none; height: 76%; width: auto; aspect-ratio: 1; margin: 0 -12%; object-fit: contain; filter: drop-shadow(0 14px 18px rgba(20, 35, 27, 0.22)); }
.hero__img--drinks img:nth-child(n + 3) { height: 62%; margin: 0 -13%; }
/* food cut-outs are wide, not tall: a smaller, tighter overlapping row */
.hero__img--sides img { height: 64%; margin: 0 -6%; }
.hero__img--desserts img { height: 86%; margin: 0 -7%; }
.hero__img--sides img:nth-child(2), .hero__img--desserts img:nth-child(2) { position: relative; z-index: 1; transform: translateY(14%); }
.hero__pre { font: 500 18px/1 var(--f-display); font-stretch: 85%; text-transform: uppercase; letter-spacing: 0.02em; color: var(--ink-muted); }
.hero__t { margin: 6px 0 14px; font: 900 clamp(40px, 6.5vw, 60px)/0.92 var(--f-display); font-stretch: 72%; text-transform: uppercase; }
.hero__d { max-width: 46ch; font-size: 15px; line-height: 1.55; }

.shelf__t { margin: 40px 0 -12px; font: 900 clamp(26px, 4vw, 32px)/1 var(--f-display); font-stretch: 74%; text-transform: uppercase; }
.grid { list-style: none; margin: 32px 0 0; padding: 0; display: grid; gap: 24px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
@media (min-width: 760px) { .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 519px) { .grid { gap: 12px; } }
.grid > li { display: flex; }
.dc { display: flex; flex-direction: column; width: 100%; border: 1px solid #d6d1c6; background: #fff; }
.dc.is-missing { border-color: var(--chili); }
.dc__img { position: relative; display: block; aspect-ratio: 1; background: var(--surface); }
.dc__img img { position: absolute; inset: 8%; width: 84%; height: 84%; object-fit: contain; filter: drop-shadow(0 12px 16px rgba(20, 35, 27, 0.2)); }
.dc__img.is-empty img { inset: 25%; width: 50%; height: 50%; opacity: 0.5; filter: none; }
.dc__body { display: flex; flex-direction: column; gap: 4px; flex: 1; padding: 14px 16px 16px; }
.dc__tag-slot { min-height: 20px; }
.dc__tag { display: inline-block; padding: 3px 8px; border-radius: 3px; background: var(--guac); color: #fff; font: 900 11px/1.2 var(--f-display); font-stretch: 82%; text-transform: uppercase; letter-spacing: 0.06em; }
.dc__name { font: 900 20px/1.05 var(--f-display); font-stretch: 76%; text-transform: uppercase; }
.dc__price { font-size: 16px; font-weight: 800; }
.dc__text { margin-top: 2px; font-size: 13.5px; line-height: 1.45; color: var(--ink-muted); }
.dc__pick { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 0; padding: 0; border: 0; min-width: 0; }
.chip { min-height: 36px; padding: 0 12px; border: 1.5px solid #cfc9bc; border-radius: 999px; background: #fff; color: var(--ink); font: 700 13px/1 var(--f-body); cursor: pointer; }
.chip:hover { border-color: var(--ink); }
.chip[aria-pressed='true'] { border-color: var(--guac); background: var(--guac); color: #fff; }
.dc__err { font-size: 13px; font-weight: 700; color: var(--chili); }
/* margin-top: auto keeps every ADD button on the same line across a row */
.dc__add { display: grid; place-items: center; min-height: 44px; margin-top: auto; border: 0; border-radius: 3px; background: var(--ink); color: #fff; font: 900 15px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; }
.dc__body > :nth-last-child(2) { margin-bottom: 14px; }
.dc__add:hover { background: var(--guac); }
.dc__add--alt { background: #fff; color: var(--ink); border: 1.5px solid var(--ink); text-decoration: none; }
.dc__add--alt:hover { background: var(--ink); color: #fff; }
.dc__tag--kids { background: var(--ink); }
.chip:focus-visible, .dc__add:focus-visible, .back:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
@media (max-width: 519px) {
  .dc__body { padding: 10px 10px 12px; }
  .dc__name { font-size: 17px; }
  .dc__text { display: none; }
  .chip { min-height: 34px; padding: 0 10px; font-size: 12px; }
}
</style>
