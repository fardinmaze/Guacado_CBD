<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { calLabel, findItem } from '@/order/lib/catalog'
import { cents, fromCents } from '@/order/lib/pricing'

defineProps({
  eyebrow: { type: String, default: 'Worth a craving' },
})

// "Featured", laid out like chipotle.com/#menu: wax-paper band, centred title, then a carousel of
// tall cards (photo, NAME, "cal | price", what's in it, Order now, Build Your Own) with round
// arrows and page dots. Photos: owner's shots (Contents/Favorites + edited files), cropped 4:3 in
// public/media/favorites. Prices and calories come from the order menu data, so they never drift
// from the boards; builder dishes show the starting price.
const order = (go) => ({ path: '/order', query: { go } })
const img = (slug) => `/media/favorites/${slug}.webp`
const byo = findItem('build-your-own')
const optionCents = (slug, group, name) => findItem(slug).groups.find((g) => g.key === group).options.find((o) => o.name === name).priceCents
const BUILD = order('build')

const favorites = [
  {
    id: 'birria-pie', name: 'Birria Pie', image: img('birria-pie'), alt: 'Birria pie cut into slices, topped with cilantro, onion and lime',
    cal: calLabel(findItem('birria-tacos')), price: cents(optionCents('birria-tacos', 'size', 'Pie')),
    text: 'A whole birria pie griddled with cheese and topped with onion, cilantro and lime. Chicken or beef.',
    to: order('item:birria-tacos'), badge: 'Signature',
  },
  {
    id: 'steak-bowl', name: 'Steak Burrito Bowl', image: img('steak-bowl'), alt: 'Grilled steak bowl with rice, corn, guac and a drizzle of sauce',
    cal: calLabel(byo), price: cents(optionCents('build-your-own', 'protein', 'Grilled Steak')),
    text: 'Grilled steak over rice with corn, fresh toppings and a homemade sauce.',
    to: order('build:bowl'),
  },
  {
    id: 'birria-tacos', name: 'Birria Tacos', image: img('birria-tacos'), alt: 'Birria tacos with lime, pickled onion and a cup of consommé',
    cal: calLabel(findItem('birria-tacos')), price: `From ${cents(optionCents('birria-tacos', 'size', '2 pc'))}`,
    text: 'Slow-braised, griddled with cheese and served with consommé for dipping. Chicken or beef.',
    to: order('item:birria-tacos'),
  },
  {
    id: 'crunchwrap', name: 'Crunchwrap', image: img('crunchwrap'), alt: 'Crunchwrap cut in half with a side of queso',
    cal: calLabel(byo), price: `From ${cents(fromCents(byo))}`,
    text: 'Your protein and toppings, folded and grilled until crispy.',
    to: order('build:crunch-wrap'),
  },
  {
    id: 'tacos', name: 'Tacos', image: img('tacos'), alt: 'Three loaded tacos in a takeout box',
    cal: calLabel(findItem('tacos')), price: `From ${cents(fromCents(findItem('tacos')))}`,
    text: 'Soft or crispy, with one meat and your choice of toppings.',
    to: order('item:tacos'),
  },
  {
    id: 'taco-salad', name: 'Taco Salad', image: img('taco-salad'), alt: 'Taco salad in a crispy tortilla bowl',
    cal: calLabel(byo), price: `From ${cents(fromCents(byo))}`,
    text: 'Fresh greens and your protein in a crispy tortilla bowl.',
    to: order('build:taco-salad'),
  },
  {
    id: 'churros', name: 'Churros', image: img('churros'), alt: 'Churros dusted with cookie crumbs',
    cal: '', price: cents(findItem('churros').basePriceCents),
    text: 'Crispy fried churros, dusted and ready for dessert.',
    to: order('item:churros'),
  },
]

// Carousel: native horizontal scroll with snap; arrows move one page, dots show the page.
const row = ref(null)
const page = ref(0)
const pages = ref(1)
function measure() {
  const el = row.value
  if (!el) return
  const card = el.querySelector('li')
  const per = card ? Math.max(1, Math.round(el.clientWidth / card.offsetWidth)) : 1
  pages.value = Math.max(1, Math.ceil(favorites.length / per))
  const max = el.scrollWidth - el.clientWidth
  page.value = max > 0 ? Math.round((el.scrollLeft / max) * (pages.value - 1)) : 0
}
function goTo(p) {
  const el = row.value
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  el.scrollTo({ left: pages.value > 1 ? (max * p) / (pages.value - 1) : 0, behavior: 'smooth' })
}
const step = (dir) => goTo(Math.min(pages.value - 1, Math.max(0, page.value + dir)))
onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
})
onBeforeUnmount(() => window.removeEventListener('resize', measure))
</script>

<template>
  <section class="feat" aria-labelledby="feat-title">
    <span v-if="eyebrow" class="feat__eyebrow">{{ eyebrow }}</span>
    <h2 id="feat-title">Featured</h2>
    <div class="feat__rail">
      <button type="button" class="feat__arrow feat__arrow--prev" aria-label="Previous featured items" :disabled="page === 0" @click="step(-1)">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
      <ul ref="row" class="feat__row" @scroll.passive="measure">
        <li v-for="t in favorites" :key="t.id">
          <article class="fc">
            <span class="fc__img">
              <img :src="t.image" :alt="t.alt" width="900" height="675" loading="lazy" decoding="async" />
              <span v-if="t.badge" class="fc__badge">{{ t.badge }}</span>
            </span>
            <div class="fc__body">
              <h3 class="fc__name">{{ t.name }}</h3>
              <p class="fc__meta"><span v-if="t.cal">{{ t.cal }}</span><span>{{ t.price }}</span></p>
              <p class="fc__text">{{ t.text }}</p>
              <div class="fc__act">
                <RouterLink :to="t.to" class="fc__btn">Order now<span class="sr-only">: {{ t.name }}</span></RouterLink>
                <RouterLink :to="BUILD" class="fc__own">Build Your Own</RouterLink>
              </div>
            </div>
          </article>
        </li>
      </ul>
      <button type="button" class="feat__arrow feat__arrow--next" aria-label="Next featured items" :disabled="page >= pages - 1" @click="step(1)">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
    </div>
    <div v-if="pages > 1" class="dots" role="group" aria-label="Featured pages">
      <button v-for="p in pages" :key="p" type="button" class="dot" :class="{ on: page === p - 1 }" :aria-label="`Page ${p}`" :aria-current="page === p - 1 ? 'true' : null" @click="goTo(p - 1)" />
    </div>
  </section>
</template>

<style scoped>
.feat {
  background-color: #f6f1e6;
  /* Owner's Guacado wax-paper pattern (public/media/wax-background.jpg), shown at 12% opacity. */
  background-image: linear-gradient(rgba(250, 247, 238, 0.88), rgba(250, 247, 238, 0.88)), url('/media/wax-background.jpg');
  background-size: auto, auto 170px;
  background-repeat: no-repeat, repeat;
  background-position: center, top left;
  padding: clamp(40px, 5vw, 64px) 16px clamp(36px, 5vw, 56px);
  display: grid;
  /* minmax(0, 1fr): without it the column grows to fit every card in the rail and the page
     scrolls sideways on phones */
  grid-template-columns: minmax(0, 1fr);
  overflow-x: clip; /* the rail's scrolled-away cards must never widen the page */
  justify-items: center;
  gap: 10px;
}
.feat__eyebrow { font: 800 14px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.14em; color: var(--accent-text); }
h2 { font: 900 clamp(38px, 4.4vw, 52px)/1 var(--f-display); font-stretch: 72%; text-transform: uppercase; }

/* 4 cards across on desktop, 3 on tablets, ~1.3 on phones (the next one peeks in). */
.feat__rail { position: relative; width: 100%; max-width: 1000px; margin-top: 22px; }
.feat__row {
  --gap: 24px;
  list-style: none;
  margin: 0;
  padding: 4px 2px 10px;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: calc((100% - 3 * var(--gap)) / 4);
  gap: var(--gap);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}
.feat__row::-webkit-scrollbar { display: none; }
.feat__row > li { scroll-snap-align: start; display: flex; }
@media (max-width: 900px) { .feat__row { --gap: 18px; grid-auto-columns: calc((100% - 2 * var(--gap)) / 3); } }
@media (max-width: 640px) { .feat__row { --gap: 14px; grid-auto-columns: 74%; } }

/* Tall card: photo, then text, buttons pinned to the bottom so every card lines up. */
.fc { display: flex; flex-direction: column; width: 100%; min-height: 470px; background: #fff; box-shadow: 0 1px 2px rgba(20, 35, 27, 0.08), 0 10px 24px -16px rgba(20, 35, 27, 0.35); }
.fc__img { position: relative; display: block; aspect-ratio: 3 / 2; background: #000; overflow: hidden; }
.fc__img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
.fc:hover .fc__img img { transform: scale(1.04); }
.fc__badge { position: absolute; top: 10px; left: 10px; padding: 5px 10px; border-radius: 999px; background: var(--lime); color: var(--on-lime); font: 900 11px/1 var(--f-display); font-stretch: 85%; text-transform: uppercase; letter-spacing: 0.08em; }
.fc__body { display: flex; flex-direction: column; gap: 6px; flex: 1; padding: 18px 16px 16px; }
.fc__name { font: 900 20px/1.05 var(--f-display); font-stretch: 76%; text-transform: uppercase; }
.fc__meta { display: flex; flex-wrap: wrap; align-items: center; font-size: 15px; font-weight: 700; }
.fc__meta span + span::before { content: ''; display: inline-block; width: 1px; height: 14px; margin: 0 10px; vertical-align: -2px; background: var(--ink-muted); }
.fc__text { font-size: 13.5px; line-height: 1.45; color: var(--ink-muted); }
.fc__act { display: grid; gap: 4px; margin-top: auto; padding-top: 16px; }
.fc__btn { display: block; padding: 13px 10px; border-radius: 3px; background: var(--ink); color: #fff; text-align: center; text-decoration: none; font: 900 15px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.05em; }
.fc__btn:hover { background: var(--guac); }
.fc__own { display: block; padding: 10px; text-align: center; color: var(--ink); text-decoration: none; font: 900 13px/1 var(--f-display); font-stretch: 82%; text-transform: uppercase; letter-spacing: 0.05em; }
.fc__own:hover { color: var(--accent-text); text-decoration: underline; text-underline-offset: 3px; }
.fc__btn:focus-visible, .fc__own:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

.feat__arrow {
  position: absolute;
  top: 210px;
  z-index: 1;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: #fff;
  color: var(--ink);
  box-shadow: var(--shadow-lift);
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, opacity 0.2s;
}
.feat__arrow:hover:not(:disabled) { background: var(--guac); color: #fff; }
.feat__arrow:disabled { opacity: 0.45; cursor: default; }
.feat__arrow:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.feat__arrow--prev { left: -64px; }
.feat__arrow--next { right: -64px; }
@media (max-width: 1160px) { .feat__arrow--prev { left: -14px; } .feat__arrow--next { right: -14px; } }
@media (hover: none) { .feat__arrow { display: none; } }

.dots { display: flex; gap: 2px; margin-top: 14px; }
.dot { width: 24px; height: 24px; border: 0; background: none; display: grid; place-items: center; cursor: pointer; }
.dot::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #c8bfb0; transition: background-color 0.2s, transform 0.2s; }
.dot.on::before { background: var(--ink); transform: scale(1.2); }
.dot:focus-visible { outline: 3px solid var(--focus); outline-offset: -4px; border-radius: 50%; }
@media (prefers-reduced-motion: reduce) { .fc__img img, .dot::before, .feat__arrow { transition: none; } }
</style>
