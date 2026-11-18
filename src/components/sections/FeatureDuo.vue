<script setup>
import LoopVideo from '@/components/ui/LoopVideo.vue'

// Three story cards: video on top, copy underneath. The order button slides in on hover
// (or keyboard focus); touch screens always show it. The Birria card is the highlighted one.
// Videos are the owner's vertical 4K menu clips, cropped to 4:5 and re-encoded (~0.6–1.5 MB).
const cards = [
  {
    id: 'guac',
    title: 'Make room for guac',
    text: 'Fresh guacamole, mashed and mixed in-house. A scoop makes any bowl, burrito, nachos or tacos even better.',
    video: '/media/feature-guac.mp4',
    poster: '/media/feature-guac.jpg',
    label: 'Fresh guacamole being mashed, mixed and scooped onto a burrito bowl',
    cta: 'Add fresh guac',
    go: 'item:guacamole',
  },
  {
    id: 'queso',
    title: 'Say queso',
    text: 'Warm, creamy queso poured over grilled steak or served with chips for dipping. Add it to any order.',
    video: '/media/feature-queso.mp4',
    poster: '/media/feature-queso.jpg',
    label: 'Creamy queso being ladled over grilled steak',
    cta: 'Add queso',
    go: 'item:queso',
  },
  {
    id: 'birria',
    title: 'Birria tacos',
    text: 'Slow-braised, griddled with cheese and served with a cup of consommé for dipping. Chicken or beef.',
    video: '/media/feature-birria.mp4',
    poster: '/media/feature-birria.jpg',
    label: 'Birria tacos griddled with cheese, then dipped in consommé',
    cta: 'Order birria tacos',
    go: 'item:birria-tacos',
    badge: 'Signature',
    highlight: true,
  },
]
</script>

<template>
  <section class="trio" aria-label="Featured">
    <article v-for="c in cards" :key="c.id" class="fcard" :class="{ 'is-hi': c.highlight }">
      <div class="fcard__media">
        <LoopVideo :src="c.video" :poster="c.poster" :label="c.label" />
        <span v-if="c.badge" class="fcard__badge">{{ c.badge }}</span>
      </div>
      <div class="fcard__copy">
        <h2>{{ c.title }}</h2>
        <p>{{ c.text }}</p>
        <RouterLink :to="{ path: '/order', query: { go: c.go } }" class="fcard__btn">{{ c.cta }}</RouterLink>
      </div>
    </article>
  </section>
</template>

<style scoped>
.trio { max-width: 1100px; margin: 0 auto; padding: clamp(24px, 4vw, 48px) 16px clamp(40px, 6vw, 72px); display: grid; gap: 20px; }
@media (min-width: 760px) { .trio { grid-template-columns: repeat(3, 1fr); gap: 24px; align-items: stretch; } }
@media (max-width: 759px) { .trio { max-width: 440px; } }

.fcard {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s;
}
.fcard__media { position: relative; aspect-ratio: 4 / 5; background: #000; }
.fcard__copy { display: flex; flex-direction: column; gap: 10px; padding: 20px 20px 22px; flex: 1; }
.fcard h2 { font: 900 clamp(26px, 2.6vw, 32px)/1 var(--f-display); font-stretch: 72%; text-transform: uppercase; }
.fcard p { font-size: 14px; line-height: 1.5; color: var(--ink-muted); }
.fcard__btn {
  margin-top: auto;
  display: block;
  text-align: center;
  background: var(--ink);
  color: #fff;
  padding: 13px 10px;
  border-radius: 3px;
  text-decoration: none;
  font: 800 15px/1 var(--f-display);
  font-stretch: 80%;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition: opacity 0.25s, transform 0.25s, background-color 0.2s;
}
.fcard__btn:hover { background: var(--guac); }

/* Highlighted card (Birria): green card, lime title, lime button. Same size and position as the
   other two; only the colour sets it apart. */
.fcard.is-hi { background: var(--guac); border-color: var(--guac); color: var(--on-green); box-shadow: 0 22px 44px -24px rgba(0, 109, 68, 0.65); }
.fcard.is-hi h2 { color: var(--lime); }
.fcard.is-hi p { color: rgba(255, 255, 255, 0.88); }
.fcard.is-hi .fcard__btn { background: var(--lime); color: var(--on-lime); }
.fcard.is-hi .fcard__btn:hover { background: #fff; color: var(--guac); }
.fcard__badge {
  position: absolute;
  top: 14px;
  left: 14px;
  background: var(--lime);
  color: var(--on-lime);
  font: 900 12px/1 var(--f-display);
  font-stretch: 80%;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 7px 11px;
  border-radius: 999px;
}

/* Hover / keyboard focus reveals the button (mouse devices). The button keeps its space,
   so revealing it never shifts the layout. */
@media (hover: hover) {
  .fcard__btn { opacity: 0; transform: translateY(8px); }
  .fcard:hover .fcard__btn, .fcard:focus-within .fcard__btn { opacity: 1; transform: none; }
  .fcard:hover { transform: translateY(-6px); box-shadow: 0 22px 40px -26px rgba(20, 35, 27, 0.5); }
}
@media (prefers-reduced-motion: reduce) {
  .fcard, .fcard__btn { transition: none; }
}
</style>
