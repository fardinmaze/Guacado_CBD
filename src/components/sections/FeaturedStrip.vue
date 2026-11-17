<script setup>
import Brand from '@/components/ui/Brand.vue'
import { featuredTiles } from '@/data/catalog'

defineProps({
  eyebrow: { type: String, default: 'Worth a craving' },
  cta: { type: String, default: 'Explore the menu' },
  ctaTo: { type: [String, Object], default: '/menu' },
})

// "Featured": patterned band, centred title and button, three photo cards with a caption bar.
</script>

<template>
  <section class="feat" aria-labelledby="feat-title">
    <span class="feat__eyebrow">{{ eyebrow }}</span>
    <h2 id="feat-title">The <Brand /> favorites.</h2>
    <p class="feat__body">From loaded bowls to birria tacos, find something you'll want to come back for.</p>
    <RouterLink :to="ctaTo" class="feat__btn">{{ cta }}</RouterLink>
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
.feat__row { list-style: none; margin: 14px 0 0; padding: 0; width: 100%; max-width: 1000px; display: grid; gap: 18px; }
@media (min-width: 720px) { .feat__row { grid-template-columns: repeat(3, 1fr); } }
.fc { display: block; text-decoration: none; background: #fff; }
.fc__img { display: block; aspect-ratio: 16 / 12; background: #000; overflow: hidden; }
.fc__img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
.fc:hover img { transform: scale(1.04); }
.fc__cap { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; padding: 14px 14px; font-weight: 700; font-size: 15px; color: var(--ink); }
.fc__cap small { font-size: 12.5px; color: var(--ink-muted); font-weight: 600; white-space: nowrap; }
</style>
