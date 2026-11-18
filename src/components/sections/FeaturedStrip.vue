<script setup>
import { ref } from 'vue'
import Brand from '@/components/ui/Brand.vue'

defineProps({
  eyebrow: { type: String, default: 'Worth a craving' },
  cta: { type: String, default: 'Explore the menu' },
  ctaTo: { type: [String, Object], default: '/menu' },
})

// "Featured": patterned band, centred title and button, then a swipeable row of photo cards.
// Photos: owner's shots in Contents/Favorites, cropped 4:3 and converted to WebP in
// public/media/favorites. Each card opens that dish in the order flow.
const order = (go) => ({ path: '/order', query: { go } })
const img = (slug) => `/media/favorites/${slug}.webp`
const favorites = [
  { id: 'birria-pie', name: 'Birria Pie', image: img('birria-pie'), alt: 'Birria pie cut into slices, topped with cilantro, onion and lime', to: order('item:birria-tacos') },
  { id: 'steak-bowl', name: 'Steak Burrito Bowl', image: img('steak-bowl'), alt: 'Grilled steak bowl with rice, corn, guac and a drizzle of sauce', to: order('build') },
  { id: 'crunchwrap', name: 'Crunchwrap', image: img('crunchwrap'), alt: 'Crunchwrap cut in half with a side of queso', to: order('build') },
  { id: 'tacos', name: 'Tacos', image: img('tacos'), alt: 'Three loaded tacos in a takeout box', to: order('item:tacos') },
  { id: 'taco-salad', name: 'Taco Salad', image: img('taco-salad'), alt: 'Taco salad in a crispy tortilla bowl', to: order('build') },
  { id: 'birria-cup', name: 'Birria Tacos', image: img('birria-cup'), alt: 'Cup of birria topped with onion and cilantro', to: order('item:birria-tacos') },
  { id: 'churros', name: 'Churros', image: img('churros'), alt: 'Churros dusted with cookie crumbs', to: order('item:churros') },
]

// Arrow buttons scroll the row by one card; swipe / trackpad work as normal.
const row = ref(null)
function step(dir) {
  const el = row.value
  if (!el) return
  const card = el.querySelector('li')
  const gap = parseFloat(getComputedStyle(el).columnGap) || 0
  el.scrollBy({ left: dir * ((card?.offsetWidth ?? 300) + gap), behavior: 'smooth' })
}
</script>

<template>
  <section class="feat" aria-labelledby="feat-title">
    <span class="feat__eyebrow">{{ eyebrow }}</span>
    <h2 id="feat-title">The <Brand /> favorites.</h2>
    <p class="feat__body">From loaded bowls to birria tacos, find something you'll want to come back for.</p>
    <RouterLink :to="ctaTo" class="feat__btn">{{ cta }}</RouterLink>
    <div class="feat__rail">
      <button type="button" class="feat__arrow feat__arrow--prev" aria-label="Previous favorites" @click="step(-1)">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
      <ul ref="row" class="feat__row">
        <li v-for="t in favorites" :key="t.id">
          <RouterLink :to="t.to" class="fc">
            <span class="fc__img"><img :src="t.image" :alt="t.alt" width="900" height="675" loading="lazy" decoding="async" /></span>
            <span class="fc__cap">{{ t.name }}</span>
          </RouterLink>
        </li>
      </ul>
      <button type="button" class="feat__arrow feat__arrow--next" aria-label="Next favorites" @click="step(1)">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
    </div>
  </section>
</template>

<style scoped>
.feat {
  background-color: #f6f1e6;
  /* Owner's Guacado wax-paper pattern (public/media/wax-background.jpg, from Contents/) */
  /* Small repeating tile like chipotle.com's Featured band. The wax pattern shows at 24% opacity
     (a 76% cream layer over it), so the copy stays clear. */
  background-image: linear-gradient(rgba(250, 247, 238, 0.76), rgba(250, 247, 238, 0.76)), url('/media/wax-background.jpg');
  background-size: auto, auto 170px;
  background-repeat: no-repeat, repeat;
  background-position: center, top left;
  padding: clamp(36px, 5vw, 64px) 16px clamp(40px, 6vw, 72px);
  display: grid;
  justify-items: center;
  gap: 14px;
}
.feat__eyebrow { font: 800 14px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.14em; color: var(--accent-text); }
.feat__body { font-size: 15px; color: var(--ink-muted); max-width: 46ch; text-align: center; }
h2 { font: 900 clamp(34px, 4vw, 48px)/1 var(--f-display); font-stretch: 72%; text-transform: uppercase; }
.feat__btn { background: var(--ink); color: #fff; padding: 13px 26px; border-radius: 3px; text-decoration: none; font: 800 15px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.06em; }
.feat__btn:hover { background: var(--guac); }

/* Row of cards: 3 visible on desktop, ~1.2 on phones (the next card peeks in to invite a swipe). */
.feat__rail { position: relative; width: 100%; max-width: 1000px; margin-top: 14px; }
.feat__row {
  list-style: none;
  margin: 0;
  padding: 0 0 6px;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: calc((100% - 2 * 18px) / 3);
  gap: 18px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}
.feat__row::-webkit-scrollbar { display: none; }
.feat__row li { scroll-snap-align: start; }
@media (max-width: 719px) { .feat__row { grid-auto-columns: 82%; gap: 14px; } }

.feat__arrow {
  position: absolute;
  top: calc(50% - 26px);
  z-index: 1;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: #fff;
  color: var(--ink);
  box-shadow: var(--shadow-lift);
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}
.feat__arrow:hover { background: var(--guac); color: #fff; }
.feat__arrow:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.feat__arrow--prev { left: -22px; }
.feat__arrow--next { right: -22px; }
@media (max-width: 1080px) { .feat__arrow--prev { left: 8px; } .feat__arrow--next { right: 8px; } }
@media (hover: none) { .feat__arrow { display: none; } }

.fc { display: block; text-decoration: none; background: #fff; }
.fc__img { display: block; aspect-ratio: 4 / 3; background: #000; overflow: hidden; }
.fc__img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
.fc:hover img { transform: scale(1.04); }
.fc__cap { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; padding: 14px 14px; font-weight: 700; font-size: 15px; color: var(--ink); }
@media (prefers-reduced-motion: reduce) {
  .fc__img img { transition: none; }
  .feat__row { scroll-behavior: auto; }
}
</style>
