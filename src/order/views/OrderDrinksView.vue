<script setup>
import { reactive } from 'vue'
import { categories, findItem } from '@/order/lib/catalog'
import { cents } from '@/order/lib/pricing'
import { useOrder } from '@/order/useOrder'
import { useBagSheet } from '@/order/useBagSheet'
import { useToast } from '@/composables/useToast'
import badge from '@/assets/logos/guacado-badge.webp'
import StickyBar from '@/order/components/StickyBar.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

// /order/:store/drinks — every drink on one page, dressed like the Kids / Family Kit pickers:
// photo banner, then a photo card per drink with its price and ADD TO BAG. Drinks with a choice
// (Jarritos flavor, Coke or Sprite, shake flavor) show it as chips on the card; one must be picked
// before adding. Guests stay on the page so they can add several; VIEW BAG sits at the bottom.
defineProps({ store: { type: String, required: true } })
const order = useOrder()
const toast = useToast()
const { show: showBag } = useBagSheet()

const drinks = categories.find((c) => c.slug === 'beverages').items.map((i) => findItem(i.slug))
const HERO = ['bottle-drink', 'mexican-soda', 'organic-tractor-strawberry-dragon-fruit', 'red-bull']
  .map((s) => drinks.find((d) => d.slug === s)?.image)
  .filter(Boolean)

// Kids milk comes only with a kids meal, so its card points there instead of adding it alone.
const KIDS_MILK = { name: 'Organic Milk Kids', image: '/media/build/drink-kids-milk.webp' }

const choiceGroup = (d) => d.groups.find((g) => g.minSelect > 0) ?? null
const picked = reactive({}) // slug -> option name
const missing = reactive({}) // slug -> true when ADD was pressed without a choice
const blurb = (d) => d.description ?? (choiceGroup(d) ? `${choiceGroup(d).options.length} flavors to choose from.` : '')

function choose(d, name) {
  picked[d.slug] = picked[d.slug] === name ? undefined : name
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
    <RouterLink :to="`/order/${store}`" class="back"><span aria-hidden="true">‹</span> Return to menu</RouterLink>

    <header class="hero">
      <div class="hero__img" aria-hidden="true">
        <img v-for="(src, i) in HERO" :key="src" :src="src" alt="" width="360" height="360" :style="{ '--i': i }" />
      </div>
      <div class="hero__copy">
        <p class="hero__pre">Pick your</p>
        <h1 class="hero__t">Drinks</h1>
        <p class="hero__d">Jarritos and glass-bottle Coke or Sprite, can soda, organic Tractor drinks, Red Bull, organic milk, shakes and water.</p>
      </div>
    </header>

    <ul class="grid">
      <li v-for="d in drinks" :key="d.slug">
        <article class="dc" :class="{ 'is-missing': missing[d.slug] }">
          <span class="dc__img" :class="{ 'is-empty': !d.image }">
            <img :src="d.image || badge" alt="" width="360" height="360" loading="lazy" decoding="async" />
          </span>
          <div class="dc__body">
            <span class="dc__tag-slot"><span v-if="d.tag" class="dc__tag">{{ d.tag }}</span></span>
            <h2 class="dc__name">{{ d.name }}</h2>
            <p class="dc__price">{{ cents(d.basePriceCents) }}</p>
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
              >{{ o.name }}<template v-if="o.priceCents"> +{{ cents(o.priceCents) }}</template></button>
            </fieldset>
            <p v-if="missing[d.slug]" class="dc__err" role="alert">Choose one first.</p>

            <button type="button" class="dc__add" @click="add(d)">Add to bag<span class="sr-only">: {{ d.name }}</span></button>
          </div>
        </article>
      </li>
      <li>
        <article class="dc">
          <span class="dc__img"><img :src="KIDS_MILK.image" alt="" width="360" height="360" loading="lazy" decoding="async" /></span>
          <div class="dc__body">
            <span class="dc__tag-slot"><span class="dc__tag dc__tag--kids">Kids meal only</span></span>
            <h2 class="dc__name">{{ KIDS_MILK.name }}</h2>
            <p class="dc__price">Included</p>
            <p class="dc__text">Comes with every kids meal, or swap it for water.</p>
            <RouterLink :to="`/order/${store}/kids`" class="dc__add dc__add--alt">See kids meals</RouterLink>
          </div>
        </article>
      </li>
    </ul>

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
.hero__img img:nth-child(n + 3) { height: 62%; margin: 0 -13%; }
.hero__pre { font: 500 18px/1 var(--f-display); font-stretch: 85%; text-transform: uppercase; letter-spacing: 0.02em; color: var(--ink-muted); }
.hero__t { margin: 6px 0 14px; font: 900 clamp(40px, 6.5vw, 60px)/0.92 var(--f-display); font-stretch: 72%; text-transform: uppercase; }
.hero__d { max-width: 46ch; font-size: 15px; line-height: 1.55; }

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
