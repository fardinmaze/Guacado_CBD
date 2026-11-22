<script setup>
import badge from '@/assets/logos/guacado-badge.webp'

// 3 x 3 flavor grid. Every tile goes straight into the ordering flow (/order): the guest
// picks a restaurant (skipped if one is remembered) and lands on that dish. `go` is read by
// src/order/lib/go.js: build | item:<slug> | cat:<slug>. Hover (or focus) lifts the tile and
// swaps the description for an "Order now" button; touch screens always show the button.
const props = defineProps({
  as: { type: String, default: 'h2' }, // use 'h1' when this grid is the page's main heading
  eyebrow: { type: String, default: '' },
  title: { type: String, default: 'Find your flavor.' },
  intro: { type: String, default: '' },
})

// Owner food photos (transparent cut-outs, trimmed + resized into public/media/menu).
// Tiles without `img` are placeholders and show the Guacado badge until a photo arrives.
const img = (name) => `/media/menu/${name}.webp`
// Order set by the owner: rows of three (… Salad Bowl, Crunchwrap, Family Kit / Kids Meal, Sides,
// Tostada Special), then Desserts and Drinks together, centred, on the last row.
const cats = [
  { id: 'burrito', name: 'Burrito', sub: 'Wrapped your way', img: img('burrito'), go: 'build:burrito' },
  { id: 'bowl', name: 'Burrito Bowl', sub: 'Your favorite flavors, all in one bowl', img: img('burrito-bowl'), badge: 'Fan favorite', go: 'build:bowl' },
  { id: 'birria', name: 'Birria Tacos', sub: 'Chicken or beef', img: img('birria-tacos'), badge: 'Signature', go: 'item:birria-tacos' },
  { id: 'taco-salad', name: 'Taco Salad Bowl', sub: 'Crispy shell, fresh toppings, your protein', img: img('taco-salad-bowl'), go: 'build:taco-salad' },
  { id: 'quesadilla', name: 'Quesadilla', sub: 'Golden, grilled and melty', img: img('quesadilla'), go: 'build:quesadilla' },
  { id: 'plates', name: 'Loaded Plates', sub: 'Piled high with your favorites', img: img('loaded-nachos'), go: 'build:nachos' },
  { id: 'salad', name: 'Salad Bowl', sub: 'Fresh greens, bold toppings', img: img('salad-bowl'), go: 'build:salad' },
  { id: 'crunchwrap', name: 'Crunchwrap', sub: 'Crispy, folded and loaded', img: img('crunchwrap'), go: 'build:crunch-wrap' },
  { id: 'family', name: 'Family Kit', sub: 'Tacos, nachos or fajitas for the whole table', img: '/media/family-kit.webp', photo: true, badge: 'Feeds 4–6', go: 'family' },
  { id: 'kids', name: 'Kids Meal', sub: 'Little appetites, big flavor', img: img('kids-meal'), go: 'kids' },
  { id: 'sides', name: 'Sides', sub: 'Fries, chips and dips to share', img: img('loaded-fries'), go: 'sides' },
  { id: 'tostada', name: 'Tostada Special', sub: 'Crunch into something good', img: img('tostada-special'), go: 'item:tostada' },
  { id: 'desserts', name: 'Desserts', sub: 'Churros, Oreo churros, tres leches and plantains', img: '/media/desserts/churros.webp', go: 'desserts' },
  { id: 'drinks', name: 'Drinks', sub: 'Jarritos, Mexican Coke, Tractor organics and more', img: '/media/build/drink-jarritos.webp', go: 'drinks' },
]
</script>

<template>
  <section id="menu" class="cats" aria-labelledby="cats-title">
    <header class="cats__head">
      <span v-if="props.eyebrow" class="cats__eyebrow">{{ props.eyebrow }}</span>
      <component :is="props.as" id="cats-title" class="cats__title">{{ props.title }}</component>
      <p v-if="props.intro" class="cats__intro">{{ props.intro }}</p>
    </header>
    <ul class="cats__grid">
      <li v-for="c in cats" :key="c.id">
        <RouterLink :to="{ path: '/order', query: { go: c.go } }" class="cat" :aria-label="`Order ${c.name}. ${c.sub}`">
          <span class="cat__img" :class="{ 'is-empty': !c.img, 'is-photo': c.photo }">
            <img :src="c.img || badge" alt="" loading="lazy" decoding="async" />
            <small v-if="!c.img" class="cat__soon">Photo coming soon</small>
          </span>
          <!-- Badge slot is always there so every name lines up across the row -->
          <span class="cat__badge-slot"><span v-if="c.badge" class="cat__badge">{{ c.badge }}</span></span>
          <span class="cat__name">{{ c.name }}</span>
          <span class="cat__foot">
            <span class="cat__sub">{{ c.sub }}</span>
            <span class="cat__cta" aria-hidden="true">Order now</span>
          </span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.cats__head { display: grid; justify-items: center; gap: 12px; margin-bottom: clamp(28px, 3.5vw, 48px); text-align: center; }
.cats__eyebrow { font: 800 14px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.14em; color: var(--accent-text); }
.cats__intro { max-width: 58ch; color: var(--ink-muted); font-size: 15px; line-height: 1.5; }
.cats__title { margin: 0; text-align: center; font: 900 clamp(34px, 4vw, 48px)/1 var(--f-display); font-stretch: 72%; text-transform: uppercase; }
.cats { padding: clamp(28px, 4vw, 56px) 16px clamp(24px, 4vw, 48px); }
/* Three per row on a 6-column track (each tile spans 2), so the last row's two tiles can be centred. */
.cats__grid { list-style: none; margin: 0 auto; padding: 0; max-width: 1100px; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 28px 8px; }
.cats__grid > li { grid-column: span 2; }
.cats__grid > li:nth-child(13) { grid-column: 2 / span 2; }
.cats__grid > li:nth-child(14) { grid-column: 4 / span 2; }
@media (min-width: 720px) { .cats__grid { gap: 64px 56px; } }
@media (max-width: 519px) {
  .cat { padding: 8px 2px 10px; }
  .cat__img { width: 100%; }
  .cat__name { font-size: 18px; }
  .cat__badge { font-size: 8px; }
  .cat__cta { padding: 8px 12px; font-size: 12px; }
}

.cat {
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 8px;
  text-align: center;
  text-decoration: none;
  padding: 14px 10px 16px;
  border-radius: 14px;
  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.28s, background-color 0.28s;
}
/* Every tile shares one 4:3 box; the cut-out photos sit inside it uncropped. */
.cat__img { position: relative; width: clamp(140px, 24vw, 270px); aspect-ratio: 4 / 3; display: grid; place-items: center; transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); }
.cat__img:not(.is-empty) img { position: absolute; inset: 0; }
.cat__badge-slot { display: grid; place-items: center; min-height: 17px; }
.cat__img img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 14px 18px rgba(20, 35, 27, 0.18)); }
/* Family Meal is a full photo, not a cut-out: rounded and cropped to the box. */
.cat__img.is-photo img { object-fit: cover; border-radius: 12px; filter: none; box-shadow: 0 14px 24px -14px rgba(20, 35, 27, 0.45); }
.cat__img.is-empty { background: var(--surface); border-radius: 14px; gap: 6px; align-content: center; }
.cat__img.is-empty img { width: 34%; height: auto; opacity: 0.55; filter: none; }
.cat__soon { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink-muted); }
.cat__badge { background: var(--ink); color: #fff; font: 800 9px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 8px; border-radius: 999px; }
.cat__name { font: 900 clamp(22px, 3.2vw, 38px)/1 var(--f-display); font-stretch: 72%; text-transform: uppercase; color: var(--ink); transition: color 0.2s; }

/* Description and button share one cell, so swapping them never shifts the layout. */
.cat__foot { display: grid; justify-items: center; align-items: center; min-height: 44px; }
.cat__foot > * { grid-area: 1 / 1; transition: opacity 0.2s, transform 0.25s; }
.cat__sub { font-size: 12.5px; color: var(--ink-muted); max-width: 26ch; }
.cat__cta {
  background: var(--guac);
  color: var(--on-green);
  padding: 11px 24px;
  border-radius: var(--r-btn);
  font: 900 15px/1 var(--f-display);
  font-stretch: 80%;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0;
  transform: translateY(8px);
}

/* Hover and keyboard focus (mouse devices). */
@media (hover: hover) {
  .cat:hover, .cat:focus-visible { transform: translateY(-6px); background: var(--surface); box-shadow: 0 18px 36px -22px rgba(20, 35, 27, 0.45); }
  .cat:hover .cat__img, .cat:focus-visible .cat__img { transform: scale(1.07); }
  .cat:hover .cat__name, .cat:focus-visible .cat__name { color: var(--accent-text); }
  .cat:hover .cat__sub, .cat:focus-visible .cat__sub { opacity: 0; transform: translateY(-8px); }
  .cat:hover .cat__cta, .cat:focus-visible .cat__cta { opacity: 1; transform: none; }
  .cat:active .cat__cta { background: var(--guac-dark); }
}
/* Touch screens have no hover, so the button is always there. */
@media (hover: none) {
  .cat__sub { display: none; }
  .cat__cta { opacity: 1; transform: none; padding: 9px 20px; font-size: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .cat, .cat__img, .cat__foot > * { transition: none; }
  .cat:hover { transform: none; }
}
</style>
