<script setup>
// Sides & dips: the owner's "SIDE main" spread as one big photo, then every side as a looping
// ticker of cut-outs. Hovering (or keyboard focus) shows the item's name and pauses the ticker;
// touch screens show the names all the time. Each item opens that dish in the order flow.
// Images: Contents/SIDEs, trimmed to square and converted to WebP in public/media/sides.
const img = (slug) => `/media/sides/${slug}.webp`
const main = { sm: '/media/sides/sides-main-900.webp', lg: '/media/sides/sides-main-1600.webp' }

// Order is deliberately mixed: chips (7 of the 13 photos) alternate with fries, guac, steak and
// tortilla, and the dip colours (green guac, white queso, red salsa) never repeat side by side.
const sides = [
  { slug: 'fries', name: 'Fries', go: 'cat:sides' },
  { slug: 'chips-guac-8oz', name: 'Chips & Guac 8oz', go: 'item:chips-guac' },
  { slug: 'nacho-cheese-fries', name: 'Nacho Cheese Fries', go: 'item:nacho-cheese-fries' },
  { slug: 'chips-salsa-4oz', name: 'Chips & Salsa 4oz', go: 'item:chips-salsa' },
  { slug: 'guacamole', name: 'Guacamole', go: 'item:guacamole' },
  { slug: 'chips-queso-8oz', name: 'Chips & Queso 8oz', go: 'item:chips-queso' },
  { slug: 'side-steak', name: 'Side of Steak', go: 'cat:sides' },
  { slug: 'chips', name: 'Chips', go: 'item:chips' },
  { slug: 'fries-dipper', name: 'Fries Dipper', go: 'item:fries-dipper' },
  { slug: 'chips-guac-4oz', name: 'Chips & Guac 4oz', go: 'item:chips-guac' },
  { slug: 'tortilla', name: 'Tortilla on the Side', go: 'item:tortilla-on-side' },
  { slug: 'chips-salsa-8oz', name: 'Chips & Salsa 8oz', go: 'item:chips-salsa' },
  { slug: 'chips-queso-4oz', name: 'Chips & Queso 4oz', go: 'item:chips-queso' },
]

// Two copies make the loop seamless (the track slides by exactly half its width).
// The second copy is hidden from screen readers and the tab order.
const track = [...sides.map((s) => ({ ...s, copy: false })), ...sides.map((s) => ({ ...s, copy: true }))]
</script>

<template>
  <section class="sides" aria-labelledby="sides-title">
    <div class="ticker" aria-label="Sides and dips">
      <ul class="ticker__track">
        <li v-for="(s, i) in track" :key="i" class="ticker__item" :aria-hidden="s.copy ? 'true' : null">
          <RouterLink
            :to="{ path: '/order', query: { go: s.go } }"
            class="ticker__link"
            :tabindex="s.copy ? -1 : null"
            :aria-label="`Order ${s.name}`"
          >
            <img :src="img(s.slug)" alt="" width="400" height="400" loading="lazy" decoding="async" />
            <span class="ticker__name">{{ s.name }}</span>
          </RouterLink>
        </li>
      </ul>
    </div>

    <div class="sides__hero">
      <picture>
        <source media="(max-width: 700px)" :srcset="main.sm" />
        <img
          :src="main.lg"
          width="1600"
          height="1280"
          loading="lazy"
          decoding="async"
          alt="A spread of Fresh Guacado bowls, a taco salad, crispy tacos and a burrito"
        />
      </picture>
      <div class="sides__copy">
        <p class="sides__eyebrow">Sides &amp; dips</p>
        <h2 id="sides-title">Round out your order.</h2>
        <p class="sides__text">Chips, guac, queso, salsa, fries and more. Add a side to any bowl, burrito or tacos.</p>
        <RouterLink :to="{ path: '/order', query: { go: 'cat:sides' } }" class="sides__btn">Order sides</RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Full-bleed: the banner and the ticker run edge to edge of the screen. */
.sides { padding: clamp(24px, 4vw, 48px) 0 clamp(40px, 6vw, 72px); }

/* Big image with the copy laid over a dark gradient on the left (stacked below on phones). */
.sides__hero { position: relative; overflow: hidden; background: var(--night); }
.sides__hero img { display: block; width: 100%; height: clamp(380px, 42vw, 620px); object-fit: cover; }
.sides__hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(10, 15, 12, 0.82) 0%, rgba(10, 15, 12, 0.55) 38%, rgba(10, 15, 12, 0) 66%);
  pointer-events: none;
}
/* Copy lines up with the 1100px content column used by the sections around it. */
.sides__copy { position: absolute; z-index: 1; left: max(var(--gut-l), calc((100% - 1100px) / 2 + 16px)); top: 50%; transform: translateY(-50%); max-width: 380px; color: var(--on-night); }
.sides__eyebrow { font: 800 13px/1 var(--f-display); font-stretch: 80%; letter-spacing: 0.12em; text-transform: uppercase; color: var(--lime); margin-bottom: 12px; }
.sides h2 { font: 900 clamp(34px, 4.4vw, 56px)/0.95 var(--f-display); font-stretch: 72%; text-transform: uppercase; }
.sides__text { margin: 14px 0 22px; font-size: 15px; line-height: 1.5; color: var(--on-night-muted); }
.sides__btn {
  display: inline-block;
  background: var(--lime);
  color: var(--on-lime);
  padding: 14px 22px;
  border-radius: var(--r-btn);
  text-decoration: none;
  font: 800 15px/1 var(--f-display);
  font-stretch: 80%;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition: background-color 0.2s, color 0.2s;
}
.sides__btn:hover { background: #fff; color: var(--guac); }

@media (max-width: 700px) {
  .sides__hero::after { display: none; }
  .sides__hero img { height: auto; aspect-ratio: 5 / 4; }
  .sides__copy { position: static; transform: none; max-width: none; padding: 22px 20px 24px; }
}

/* Ticker (above the banner, right after Favorites): one row of cut-outs sliding right to left, edges faded out. */
.ticker {
  margin-bottom: clamp(20px, 3vw, 32px);
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
}
.ticker__track { display: flex; width: max-content; list-style: none; margin: 0; padding: 0; animation: ticker 48s linear infinite; }
.ticker:hover .ticker__track, .ticker:focus-within .ticker__track { animation-play-state: paused; }
@keyframes ticker { to { transform: translateX(-50%); } }

.ticker__item { flex: none; padding: 0 clamp(6px, 1vw, 12px); }
.ticker__link { position: relative; display: block; width: clamp(130px, 14vw, 170px); text-decoration: none; color: var(--ink); border-radius: var(--r-md); }
.ticker__link img { display: block; width: 100%; height: auto; transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
.ticker__link:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }

/* Name label: a pill over the bottom of the image, shown on hover / focus. */
.ticker__name {
  position: absolute;
  left: 50%;
  bottom: 6px;
  transform: translate(-50%, 6px);
  white-space: nowrap;
  background: var(--ink);
  color: #fff;
  padding: 7px 12px;
  border-radius: var(--r-pill);
  font: 800 13px/1 var(--f-display);
  font-stretch: 80%;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s, transform 0.2s;
}
.ticker__link:hover .ticker__name, .ticker__link:focus-visible .ticker__name { opacity: 1; transform: translate(-50%, 0); background: var(--guac); }
.ticker__link:hover img, .ticker__link:focus-visible img { transform: scale(1.06); }

/* Touch screens have no hover: show every name under its image. */
@media (hover: none) {
  .ticker__name { position: static; display: block; transform: none; opacity: 1; margin-top: 4px; text-align: center; background: none; color: var(--ink); padding: 0; white-space: normal; }
}

/* Reduced motion: no sliding; the row scrolls by hand and the duplicate set is hidden. */
@media (prefers-reduced-motion: reduce) {
  .ticker { overflow-x: auto; -webkit-mask-image: none; mask-image: none; }
  .ticker__track { animation: none; }
  .ticker__item[aria-hidden='true'] { display: none; }
  .ticker__link img, .ticker__name { transition: none; }
}
</style>
