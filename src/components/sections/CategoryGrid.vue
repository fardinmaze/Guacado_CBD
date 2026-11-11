<script setup>
import { photos } from '@/data/catalog'
import { guac, tacos, tostada } from '@/assets/illustrations'
import badge from '@/assets/logos/guacado-badge.png'

// 3 x 3 flavor grid. Every tile goes straight into the ordering flow (/order): the guest
// picks a restaurant (skipped if one is remembered) and lands on that dish. `go` is read by
// src/order/lib/go.js: build | item:<slug> | cat:<slug>. Hover (or focus) lifts the tile and
// swaps the description for an "Order now" button; touch screens always show the button.
const cats = [
  { id: 'kits', name: 'Family Kits', sub: 'A spread for 4–6', img: tacos, flat: true, badge: 'Feeds a crowd', go: 'cat:family-kits' },
  { id: 'byo', name: 'Burrito & More', sub: 'Burritos, nachos and quesadillas', go: 'build' },
  { id: 'bowl', name: 'Burrito Bowl', sub: 'Your favorite flavors, all in one bowl', img: photos.bowl, badge: 'Fan favorite', go: 'build' },
  { id: 'birria', name: 'Birria Tacos', sub: 'Chicken or beef', img: photos.birria, badge: 'Signature', go: 'item:birria-tacos' },
  { id: 'tostada', name: 'Tostada', sub: 'Crunch into something good', img: tostada, flat: true, go: 'item:tostada' },
  { id: 'tacos', name: 'Tacos', sub: 'Soft or crispy', img: photos.tacos, go: 'item:tacos' },
  { id: 'kids', name: "Kid's Meal", sub: 'Little appetites, big flavor', go: 'cat:kids' },
  { id: 'sides', name: 'Chips & Sides', sub: 'Guac, queso and fries', img: guac, flat: true, go: 'cat:sides' },
  { id: 'drinks', name: 'Drinks & Desserts', sub: 'Shakes, lemonade and churros', go: 'cat:beverages' },
]
</script>

<template>
  <section id="menu" class="cats" aria-labelledby="cats-title">
    <h2 id="cats-title" class="cats__title">Find your flavor.</h2>
    <ul class="cats__grid">
      <li v-for="c in cats" :key="c.id">
        <RouterLink :to="{ path: '/order', query: { go: c.go } }" class="cat" :aria-label="`Order ${c.name}. ${c.sub}`">
          <span class="cat__img" :class="{ 'is-flat': c.flat, 'is-empty': !c.img }">
            <img :src="c.img || badge" alt="" loading="lazy" />
          </span>
          <span v-if="c.badge" class="cat__badge">{{ c.badge }}</span>
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
.cats__title { text-align: center; font: 900 clamp(34px, 4vw, 48px)/1 var(--f-display); font-stretch: 72%; text-transform: uppercase; margin-bottom: clamp(24px, 3vw, 40px); }
.cats { padding: clamp(28px, 4vw, 56px) 16px clamp(24px, 4vw, 48px); }
.cats__grid { list-style: none; margin: 0 auto; padding: 0; max-width: 1100px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 44px 24px; }
@media (min-width: 720px) { .cats__grid { grid-template-columns: repeat(3, 1fr); gap: 72px 88px; } }

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
.cat__img { width: clamp(112px, 17vw, 168px); aspect-ratio: 1; border-radius: 50%; overflow: hidden; background: #000; display: grid; place-items: center; transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); }
.cat__img.is-flat { background: transparent; border-radius: 0; width: clamp(132px, 22vw, 230px); aspect-ratio: 4 / 3; }
.cat__img.is-flat img { object-fit: contain; }
.cat__img.is-empty { background: var(--surface); }
.cat__img.is-empty img { width: 46%; height: auto; opacity: 0.55; }
.cat__img img { width: 100%; height: 100%; object-fit: cover; }
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
