<script setup>
import { photos } from '@/data/catalog'
import { guac, tacos, tostada } from '@/assets/illustrations'
import badge from '@/assets/logos/guacado-badge.png'

// 3 x 3 category grid (borderless, centred, big condensed labels). Round-cropped photos
// where the owner has them, illustrations next, brand badge where there is no image yet.
const cats = [
  { id: 'kits', name: 'Family Kits', sub: 'A spread for 4–6', img: tacos, flat: true, badge: 'Feeds a crowd', to: '/menu#family-kits' },
  { id: 'byo', name: 'Burrito & More', sub: 'Burritos, nachos and quesadillas', to: '/menu#build' },
  { id: 'bowl', name: 'Burrito Bowl', sub: 'Your favorite flavors, all in one bowl', img: photos.bowl, badge: 'Fan favorite', to: '/menu#build' },
  { id: 'birria', name: 'Birria Tacos', sub: 'Chicken or beef', img: photos.birria, badge: 'Signature', to: '/menu#signature' },
  { id: 'tostada', name: 'Tostada', sub: 'Crunch into something good', img: tostada, flat: true, to: '/menu#signature' },
  { id: 'tacos', name: 'Tacos', sub: 'Soft or crispy', img: photos.tacos, to: '/menu#signature' },
  { id: 'kids', name: "Kid's Meal", sub: 'Little appetites, big flavor', to: '/menu#kids' },
  { id: 'sides', name: 'Chips & Sides', sub: 'Guac, queso and fries', img: guac, flat: true, to: '/menu#sides' },
  { id: 'drinks', name: 'Drinks & Desserts', sub: 'Shakes, lemonade and churros', to: '/menu#drinks' },
]
</script>

<template>
  <section id="menu" class="cats" aria-labelledby="cats-title">
    <h2 id="cats-title" class="cats__title">Find your flavor.</h2>
    <ul class="cats__grid">
      <li v-for="c in cats" :key="c.id">
        <RouterLink :to="c.to" class="cat" :aria-label="`${c.name}. ${c.sub}. View menu item`">
          <span class="cat__img" :class="{ 'is-flat': c.flat, 'is-empty': !c.img }">
            <img :src="c.img || badge" alt="" loading="lazy" />
          </span>
          <span v-if="c.badge" class="cat__badge">{{ c.badge }}</span>
          <span class="cat__name">{{ c.name }}</span>
          <span class="cat__sub">{{ c.sub }}</span>
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
.cat { display: grid; justify-items: center; align-content: start; gap: 8px; text-align: center; text-decoration: none; }
.cat__img { width: clamp(112px, 17vw, 168px); aspect-ratio: 1; border-radius: 50%; overflow: hidden; background: #000; display: grid; place-items: center; transition: transform 0.25s; }
.cat__img.is-flat { background: transparent; border-radius: 0; width: clamp(132px, 22vw, 230px); aspect-ratio: 4 / 3; }
.cat__img.is-flat img { object-fit: contain; }
.cat__img.is-empty { background: var(--surface); }
.cat__img.is-empty img { width: 46%; height: auto; opacity: 0.55; }
.cat__img img { width: 100%; height: 100%; object-fit: cover; }
.cat:hover .cat__img { transform: scale(1.05); }
.cat__badge { background: var(--ink); color: #fff; font: 800 9px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 8px; border-radius: 999px; }
.cat__name { font: 900 clamp(22px, 3.2vw, 38px)/1 var(--f-display); font-stretch: 72%; text-transform: uppercase; color: var(--ink); }
.cat:hover .cat__name { color: var(--accent-text); }
.cat__sub { font-size: 12.5px; color: var(--ink-muted); }
</style>
