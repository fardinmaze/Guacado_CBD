<script setup>
import { computed, reactive, ref } from 'vue'
import { findItem } from '@/order/lib/catalog'
import { cents } from '@/order/lib/pricing'
import CateringForm from '@/components/sections/CateringForm.vue'
import badge from '@/assets/logos/guacado-badge.webp'

// Catering, laid out like catering.chipotle.com: "Build Your Own" hero with Single / Double /
// Triple per-person tiers, "Popular builds" cards with a headcount picker, Chips & Dips, Burritos
// by the Box, then the enquiry form for anything bigger. Every button goes into the catering
// order flow (/order -> restaurant -> event details -> build -> bag). Packages and prices come from
// the "catering" category in src/order/data/menu.seed.json and are SAMPLES for now.
const TIERS = ['catering-single', 'catering-double', 'catering-triple'].map(findItem)
const tier = ref(TIERS[0])
const go = (slug, people) => ({ path: '/order', query: { go: people ? `catering:${slug}:${people}` : `catering:${slug}` } })

const POPULAR = ['office-lunch', 'plant-powered', 'big-get-together', 'burrito-box'].map(findItem)
const peopleFor = (item) => {
  const out = []
  for (let n = item.minPeople ?? 10; n <= 200; n += n < 10 ? 1 : 5) out.push(n)
  return out
}
const people = reactive(Object.fromEntries(POPULAR.map((p) => [p.slug, p.minPeople ?? 10])))
// Fixed builds list what's in them; packages with choices (the burrito box) describe themselves.
const contents = (item) => (item.groups?.length ? item.description : (item.includes ?? []).join(' | '))

const chips = findItem('chips-dips-tray')
const box = findItem('burrito-box')
const tierWord = computed(() => tier.value.tier)
const IMG = {
  spread: '/media/family-kit.webp',
  // Chips & Dips orbit: chips and each dip travel slowly round the Guacado logo.
  orbit: [
    '/media/sides/chips.webp', '/media/build/top-red-salsa.webp', '/media/sides/chips-guac-8oz.webp',
    '/media/build/top-pico.webp', '/media/sides/chips-queso-8oz.webp', '/media/build/top-salsa-verde.webp',
    '/media/sides/chips-salsa-8oz.webp', '/media/build/add-guac.webp', '/media/build/add-queso.webp',
  ],
}
</script>

<template>
  <div class="cat">
    <p class="notice">Catering for pickup · Order at least 24 hours ahead</p>

    <!-- Build your own: tiers -->
    <section class="byo" aria-labelledby="byo-t">
      <div class="byo__in">
        <div class="byo__head">
          <h1 id="byo-t">Build<br />your<br />own</h1>
          <p>Minimum 10 people</p>
        </div>
        <div class="byo__tiers" role="radiogroup" aria-label="Catering size">
          <button
            v-for="t in TIERS"
            :key="t.slug"
            type="button"
            role="radio"
            class="tier"
            :class="{ on: tier.slug === t.slug }"
            :aria-checked="tier.slug === t.slug"
            @click="tier = t"
          >
            <span class="tier__n">{{ t.tier }}</span>
            <span class="tier__b">{{ t.badge }}</span>
            <span class="tier__p"><b>{{ cents(t.basePriceCents) }}</b> /person*</span>
          </button>
          <p class="byo__fine">*Pricing &amp; availability vary by location.</p>
        </div>
        <div class="byo__copy">
          <img :src="IMG.spread" alt="A Fresh Guacado catering spread" width="900" height="600" />
          <p>Build Your Own catering keeps it simple and delicious. {{ tier.description }}</p>
          <RouterLink :to="go(tier.slug)" class="btn-gold">Build your {{ tierWord }} <span aria-hidden="true">→</span></RouterLink>
          <p class="byo__note">Please place your order at least 24 hours in advance, so we can make everything fresh for your event.</p>
        </div>
      </div>
    </section>

    <!-- Popular builds -->
    <section class="pop" aria-labelledby="pop-t">
      <h2 id="pop-t">Popular builds</h2>
      <p class="pop__sub">Order the perfect crowd-pleasing spread for any occasion</p>
      <p class="pop__sub">24 hours advance notice to order</p>
      <ul class="pop__row">
        <li v-for="p in POPULAR" :key="p.slug">
          <article class="pc">
            <div class="pc__img">
              <img :src="p.image" alt="" width="900" height="600" loading="lazy" decoding="async" />
              <div class="pc__over"><h3>{{ p.name }}</h3><span>{{ p.tier }}</span></div>
            </div>
            <p class="pc__txt">{{ contents(p) }}</p>
            <div class="pc__buy">
              <span class="pc__price"><b>{{ cents(p.basePriceCents) }}</b> / person*</span>
              <label class="pc__ppl">
                <span class="sr-only">How many people for {{ p.name }}</span>
                <select v-model.number="people[p.slug]">
                  <option v-for="n in peopleFor(p)" :key="n" :value="n">{{ n }} People</option>
                </select>
              </label>
            </div>
            <RouterLink :to="go(p.slug, people[p.slug])" class="pc__add">Add to bag<span class="sr-only">: {{ p.name }} for {{ people[p.slug] }} people</span></RouterLink>
          </article>
        </li>
      </ul>
    </section>

    <!-- Chips & dips -->
    <section class="cd" aria-labelledby="cd-t">
      <div class="cd__in">
        <div class="cd__copy">
          <h2 id="cd-t">Chips &amp; dips</h2>
          <p class="cd__serves">Serves {{ chips.serves }} each</p>
          <p>{{ chips.description }}</p>
          <p class="cd__price">{{ cents(chips.basePriceCents) }} *</p>
          <RouterLink :to="go(chips.slug)" class="btn-gold">Get chips &amp; dips <span aria-hidden="true">→</span></RouterLink>
          <p class="byo__fine">*Pricing &amp; availability vary by location.</p>
        </div>
        <!-- Round path: chips and dips circle the Guacado logo (slow; still for reduced motion) -->
        <div class="orbit" aria-hidden="true">
          <span class="orbit__ring" />
          <img :src="badge" alt="" class="orbit__logo" width="200" height="206" />
          <div class="orbit__track">
            <span v-for="(t, i) in IMG.orbit" :key="t" class="orbit__item" :style="{ '--a': `${(360 / IMG.orbit.length) * i}deg` }">
              <img :src="t" alt="" width="360" height="360" loading="lazy" />
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Burritos by the box -->
    <section class="bx" aria-labelledby="bx-t">
      <div class="bx__in">
        <img :src="box.image" alt="Friends sharing burritos, bowls and chips from a Fresh Guacado bag" width="1200" height="509" loading="lazy" />
        <div class="bx__copy">
          <h2 id="bx-t">Burritos<br />by the box</h2>
          <p class="cd__serves">Minimum {{ box.minPeople }} people</p>
          <p>{{ box.description }}</p>
          <p class="cd__price">{{ cents(box.basePriceCents) }} /person *</p>
          <RouterLink :to="go(box.slug)" class="btn-gold">Start a burrito box <span aria-hidden="true">→</span></RouterLink>
          <p class="byo__note">Please place your order at least 24 hours in advance.</p>
        </div>
      </div>
    </section>

    <section class="more" aria-labelledby="more-t">
      <h2 id="more-t" class="more__t">Planning something bigger?</h2>
      <p class="more__d">Weddings, big office events, anything over 200 people: send us the details and we'll put a menu together.</p>
    </section>
    <CateringForm />
  </div>
</template>

<style scoped>
.cat { --gold: #b8860b; --band: #f1f0ee; }
.notice { margin: 0; padding: 11px 16px; background: var(--guac-dark); color: #fff; text-align: center; font: 900 14px/1.2 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.05em; }
h1, h2 { font-stretch: 72%; text-transform: uppercase; }

.btn-gold { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 48px; padding: 0 28px; border-radius: 3px; background: var(--guac); color: #fff; text-decoration: none; font: 900 18px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.03em; }
.btn-gold:hover { background: var(--guac-dark); }
.btn-gold:focus-visible, .pc__add:focus-visible, .tier:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

/* Build your own */
.byo { background: var(--band); padding: clamp(28px, 4vw, 48px) 16px; }
.byo__in { max-width: 1000px; margin: 0 auto; display: grid; gap: 28px; align-items: center; }
@media (min-width: 900px) { .byo__in { grid-template-columns: 1.1fr 0.6fr 1.2fr; gap: 36px; } .byo__tiers { border-left: 1px solid #c8bfb0; padding-left: 36px; } }
.byo__head h1 { font: 900 clamp(64px, 8.5vw, 104px)/0.86 var(--f-display); font-stretch: 72%; color: var(--ink); }
.byo__head p { margin-top: 10px; color: var(--ink-muted); }
.byo__tiers { display: grid; gap: 10px; justify-items: center; }
.tier { display: grid; justify-items: center; gap: 5px; width: 120px; padding: 12px 8px; border: 0; background: transparent; color: var(--ink); cursor: pointer; transition: background-color 0.2s, box-shadow 0.2s; }
.tier.on { background: #fff; box-shadow: 0 6px 18px -8px rgba(20, 35, 27, 0.45); }
.tier__n { font: 900 26px/1 var(--f-display); font-stretch: 76%; text-transform: uppercase; }
.tier__b { padding: 3px 7px; border-radius: 2px; background: #8d8576; color: #fff; font: 900 11px/1 var(--f-display); font-stretch: 85%; text-transform: uppercase; letter-spacing: 0.05em; }
.tier.on .tier__b { background: var(--guac); }
.tier__p { font-size: 12px; color: var(--ink-muted); }
.tier__p b { font-size: 15px; color: var(--ink); }
.byo__fine { font-size: 11.5px; color: var(--ink-muted); text-align: center; }
.byo__copy { display: grid; gap: 14px; justify-items: start; }
.byo__copy img { width: min(100%, 300px); height: auto; aspect-ratio: 3 / 2; object-fit: cover; }
.byo__copy p { font-size: 15px; line-height: 1.5; color: var(--ink-muted); }
.byo__copy .btn-gold { width: 100%; max-width: 300px; }
.byo__note { font-size: 11.5px; color: var(--ink-muted); }

/* Popular builds */
/* Same wax-paper pattern as the landing page's Featured band (public/media/wax-background.jpg). */
.pop {
  background-color: #f6f1e6;
  background-image: linear-gradient(rgba(250, 247, 238, 0.88), rgba(250, 247, 238, 0.88)), url('/media/wax-background.jpg');
  background-size: auto, auto 170px;
  background-repeat: no-repeat, repeat;
  background-position: center, top left;
  color: var(--ink);
  padding: clamp(32px, 4vw, 48px) 16px clamp(36px, 4vw, 52px); text-align: center; }
.pop h2 { font: 900 clamp(34px, 4vw, 46px)/1 var(--f-display); }
.pop__sub { margin-top: 10px; font-size: 15px; color: var(--ink-muted); }
.pop__row { list-style: none; margin: 26px auto 0; padding: 0; max-width: 1000px; display: grid; gap: 16px; }
@media (min-width: 640px) { .pop__row { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1000px) { .pop__row { grid-template-columns: repeat(4, 1fr); } }
.pop__row > li { display: flex; }
.pc { display: flex; flex-direction: column; width: 100%; background: #fff; color: var(--ink); text-align: left; box-shadow: 0 1px 2px rgba(20, 35, 27, 0.08), 0 10px 24px -16px rgba(20, 35, 27, 0.35); }
.pc__img { position: relative; aspect-ratio: 1 / 1; overflow: hidden; background: #000; }
.pc__img img { width: 100%; height: 100%; object-fit: cover; }
.pc__over { position: absolute; inset: auto 0 0; padding: 40px 12px 12px; background: linear-gradient(transparent, rgba(0, 0, 0, 0.72)); color: #fff; }
.pc__over h3 { font: 900 20px/1 var(--f-display); font-stretch: 76%; text-transform: uppercase; }
.pc__over span { display: block; margin-top: 4px; font: 800 12px/1 var(--f-display); font-stretch: 85%; text-transform: uppercase; letter-spacing: 0.04em; }
.pc__txt { flex: 1; padding: 14px 12px 6px; font-size: 12.5px; line-height: 1.5; color: var(--ink-muted); }
.pc__buy { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 12px; }
.pc__price { font-size: 12px; color: var(--ink-muted); white-space: nowrap; }
.pc__price b { font-size: 14px; color: var(--ink); }
.pc__ppl select { min-height: 36px; padding: 0 6px; border: 0; border-bottom: 1.5px solid #c8bfb0; background: transparent; font: 600 14px var(--f-body); color: var(--ink); }
.pc__add { display: grid; place-items: center; min-height: 40px; margin: 6px 12px 14px; border-radius: 3px; background: var(--guac); color: #fff; text-decoration: none; font: 900 16px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.03em; }
.pc__add:hover { background: var(--guac-dark); }

/* Chips & dips */
/* Light green band (a pale shade of the brand green) instead of grey. */
.cd { background: #eaf3df; padding: clamp(32px, 4vw, 48px) 16px; }
.cd__in { max-width: 900px; margin: 0 auto; display: grid; gap: 28px; align-items: center; }
@media (min-width: 800px) { .cd__in { grid-template-columns: 1fr 1fr; } }
.cd__copy { display: grid; gap: 10px; justify-items: start; }
.cd h2, .bx h2 { font: 900 clamp(46px, 6vw, 68px)/0.9 var(--f-display); color: var(--ink); }
.cd__serves { color: var(--ink-muted); }
.cd__copy p, .bx__copy p { font-size: 15px; line-height: 1.5; max-width: 42ch; }
.cd__price { font-weight: 800; font-size: 16px; }
/* Orbit: items sit on a dashed circle (radius 38% of the box) and the whole track turns once a
   minute; each image turns the other way at the same speed, so it stays upright. */
.orbit { --r: 38%; --size: 18%; --ry: calc(-38 / 18 * 100%); /* radius in item widths */ --spin: 60s; position: relative; justify-self: center; width: min(100%, 400px); aspect-ratio: 1; overflow: clip; } /* the spinning square's corners stuck out; the photos stay inside the circle */
.orbit__ring { position: absolute; inset: calc(50% - var(--r)); border: 2px dashed rgba(0, 109, 68, 0.35); border-radius: 50%; }
.orbit__logo { position: absolute; top: 50%; left: 50%; width: 34%; height: auto; transform: translate(-50%, -50%); filter: drop-shadow(0 10px 18px rgba(20, 35, 27, 0.25)); }
.orbit__track { position: absolute; inset: 0; animation: orbit-spin var(--spin) linear infinite; }
.orbit__item { position: absolute; top: 50%; left: 50%; width: var(--size); aspect-ratio: 1; margin: calc(var(--size) / -2) 0 0 calc(var(--size) / -2); transform: rotate(var(--a)) translateY(var(--ry)) rotate(calc(var(--a) * -1)); }
.orbit__item img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 6px 10px rgba(20, 35, 27, 0.22)); animation: orbit-spin var(--spin) linear infinite reverse; }
@keyframes orbit-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .orbit__track, .orbit__item img { animation: none; } }

/* Burritos by the box */
.bx { padding: clamp(32px, 4vw, 56px) 16px; }
.bx__in { max-width: 1000px; margin: 0 auto; display: grid; gap: 28px; align-items: center; }
@media (min-width: 800px) { .bx__in { grid-template-columns: 1.1fr 1fr; } }
.bx__in > img { width: 100%; height: auto; aspect-ratio: 4 / 3; object-fit: cover; }
.bx__copy { display: grid; gap: 10px; justify-items: start; }

.more { padding: 24px 16px 0; text-align: center; }
.more__t { font: 900 clamp(30px, 3.6vw, 40px)/1 var(--f-display); }
.more__d { max-width: 52ch; margin: 10px auto 0; color: var(--ink-muted); }
@media (prefers-reduced-motion: reduce) { .tier { transition: none; } }
</style>
