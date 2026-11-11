<script setup>
import { featuredTiles } from '@/data/catalog'

// "Featured": patterned band, centred title and button, three photo cards with a caption bar.
</script>

<template>
  <section class="feat" aria-labelledby="feat-title">
    <span class="feat__eyebrow">Worth a craving</span>
    <h2 id="feat-title">The Guacado favorites.</h2>
    <p class="feat__body">From loaded bowls to birria tacos, find something you'll want to come back for.</p>
    <RouterLink to="/menu" class="feat__btn">Explore the menu</RouterLink>
    <ul class="feat__row">
      <li v-for="t in featuredTiles" :key="t.id">
        <RouterLink :to="t.to" class="fc">
          <span class="fc__img"><img :src="t.image" :alt="t.name" width="1400" height="1046" loading="lazy" /></span>
          <span class="fc__cap">{{ t.name }}</span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.feat {
  background-color: #f6f1e6;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='%23006d44' fill-opacity='.10'%3E%3Cg transform='translate(34 36) rotate(-24)'%3E%3Cpath d='M0-26C16-26 26-8 24 8 22 24 10 30 0 30-10 30-22 24-24 8-26-8-16-26 0-26z'/%3E%3Ccircle cx='0' cy='10' r='9' fill='%23f6f1e6' fill-opacity='1'/%3E%3C/g%3E%3Cg transform='translate(120 30)'%3E%3Ccircle r='23'/%3E%3Ccircle r='17' fill='%23f6f1e6'/%3E%3Cpath d='M0-15V15M-15 0H15M-10.6-10.6L10.6 10.6M10.6-10.6L-10.6 10.6' stroke='%23006d44' stroke-opacity='.10' stroke-width='3' fill='none'/%3E%3C/g%3E%3Cpath transform='translate(190 28) rotate(35)' d='M-6-26C8-28 12-10 8 8 5 22-2 32-12 34-2 24-4 6-8-8-10-16-12-24-6-26z'/%3E%3Cg transform='translate(24 120)'%3E%3Ccircle r='21'/%3E%3Cpath d='M-9-21L0-12 9-21M0-12V-24' stroke='%23f6f1e6' stroke-width='3.5' fill='none' stroke-linecap='round'/%3E%3C/g%3E%3Cg transform='translate(112 112)'%3E%3Ccircle r='24'/%3E%3Ccircle r='17' fill='%23f6f1e6'/%3E%3Ccircle r='11'/%3E%3Ccircle r='5' fill='%23f6f1e6'/%3E%3C/g%3E%3Cg transform='translate(196 116) rotate(18)'%3E%3Ccircle cx='-9' cy='-7' r='9'/%3E%3Ccircle cx='9' cy='-7' r='9'/%3E%3Ccircle cx='0' cy='8' r='10'/%3E%3Crect x='-1.8' y='8' width='3.6' height='22' rx='1.8'/%3E%3C/g%3E%3Cpath transform='translate(34 204) rotate(-12)' d='M-24 14L0-26 26 16C10 22-10 22-24 14z'/%3E%3Cg transform='translate(124 200) rotate(-20)'%3E%3Cpath d='M-28 0A28 28 0 0 1 28 0z'/%3E%3Cpath d='M-20 0A20 20 0 0 1 20 0z' fill='%23f6f1e6'/%3E%3Cpath d='M0 0V-18M-10 0L-6-15M10 0L6-15' stroke='%23006d44' stroke-opacity='.10' stroke-width='2.5' fill='none'/%3E%3C/g%3E%3Cg transform='translate(204 204)'%3E%3Ccircle r='19'/%3E%3Ccircle r='12' fill='%23f6f1e6'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  background-size: 240px 240px;
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
.feat__row { list-style: none; margin: 14px 0 0; padding: 0; width: 100%; max-width: 1000px; display: grid; gap: 18px; }
@media (min-width: 720px) { .feat__row { grid-template-columns: repeat(3, 1fr); } }
.fc { display: block; text-decoration: none; background: #fff; }
.fc__img { display: block; aspect-ratio: 16 / 12; background: #000; overflow: hidden; }
.fc__img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
.fc:hover img { transform: scale(1.04); }
.fc__cap { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; padding: 14px 14px; font-weight: 700; font-size: 15px; color: var(--ink); }
.fc__cap small { font-size: 12.5px; color: var(--ink-muted); font-weight: 600; white-space: nowrap; }
</style>
