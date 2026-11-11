<script setup>
import { site } from '@/data/site'
import { photos, videos } from '@/data/catalog'
import LoopVideo from '@/components/ui/LoopVideo.vue'

// Two side-by-side story cards: copy on the left, media on the right, order button at the bottom.
const cards = [
  {
    id: 'byo',
    title: 'Build it your way',
    text: 'Start with your base. Choose your protein. Add your favorite toppings and sauce. Your protein sets the price; the rest is on us.',
    video: videos.tile,
    poster: photos.bowl,
    label: 'A burrito bowl being built layer by layer',
    cta: 'Start building',
    to: { path: '/order', query: { go: 'build' } },
  },
  {
    id: 'guac',
    title: 'Make room for guac',
    text: `A scoop of fresh guacamole makes a good bowl, burrito, nachos or tacos even better. Add it to any order.`,
    video: videos.guac,
    poster: photos.guac,
    label: 'A scoop of fresh guacamole landing on a burrito bowl',
    cta: 'Add fresh guac',
    href: site.orderUrl,
  },
]
</script>

<template>
  <section class="duo" aria-label="Featured">
    <article v-for="c in cards" :key="c.id" class="fcard">
      <div class="fcard__copy">
        <h2>{{ c.title }}</h2>
        <p>{{ c.text }}</p>
        <RouterLink v-if="c.to" :to="c.to" class="fcard__btn">{{ c.cta }}</RouterLink>
        <a v-else :href="c.href" class="fcard__btn">{{ c.cta }}</a>
      </div>
      <div class="fcard__media">
        <LoopVideo :src="c.video" :poster="c.poster" :label="c.label" />
      </div>
    </article>
  </section>
</template>

<style scoped>
.duo { max-width: 940px; margin: 0 auto; padding: clamp(24px, 4vw, 48px) 16px clamp(40px, 6vw, 72px); display: grid; gap: 18px; }
@media (min-width: 800px) { .duo { grid-template-columns: 1fr 1fr; gap: 24px; } }
.fcard { display: grid; grid-template-columns: 1.1fr 0.9fr; border: 1px solid var(--line); background: #fff; min-height: 340px; }
.fcard__copy { display: flex; flex-direction: column; gap: 14px; padding: 18px 16px 18px 18px; }
.fcard h2 { font: 900 clamp(24px, 2.6vw, 32px)/1.02 var(--f-display); font-stretch: 72%; text-transform: uppercase; }
.fcard p { font-size: 14px; line-height: 1.5; color: var(--ink-muted); }
.fcard__btn { margin-top: auto; display: block; text-align: center; background: var(--ink); color: #fff; padding: 13px 10px; border-radius: 3px; text-decoration: none; font: 800 15px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.06em; }
.fcard__btn:hover { background: var(--guac); }
.fcard__media { background: #000; min-height: 100%; }
@media (max-width: 480px) { .fcard { grid-template-columns: 1fr; } .fcard__media { height: 220px; order: -1; } }
</style>
