<script setup>
import { findItem } from '@/order/lib/catalog'
import { links, site } from '@/data/site'
import locationList from '@/data/locations.json'
import { locationStats } from '@/utils/locations'
import { useLocationPicker } from '@/composables/useLocationPicker'
import DoodleHeadline from '@/components/ui/DoodleHeadline.vue'
const picker = useLocationPicker()

// Our Values, laid out like chipotle.com/values: warm paper background, big lettered headlines,
// food cut-outs alternating with copy, a strip of facts, our people, and a closing order button.
// Copy only states what the site already says (guac mashed in-house, homemade sauces, fresh
// toppings, hours, locations). OWNER TO REVIEW the wording before launch.
const byo = findItem('build-your-own')
const count = (key) => byo.groups.find((g) => g.key === key).options.length
const stats = locationStats(locationList)
const IMG = {
  bowl: '/media/values/bowl.webp',
  burrito: '/media/values/burrito.webp',
  salad: '/media/values/salad.webp',
  nachos: '/media/values/nachos.webp',
  team: '/media/values/team.webp',
}
const FACTS = [
  { big: String(count('sauce')), small: 'homemade sauces' },
  { big: String(count('protein')), small: 'proteins & veggies' },
  { big: String(stats.open), small: `restaurants in ${stats.states} states` },
  { big: '7', small: 'days a week, 10:30am–3am' },
]

// Hand-lettered headlines (DoodleHeadline): same copy as before, now drawn on when scrolled to.
const HEAD_INTRO = [
  { text: 'We believe that', size: 'sm', under: 'double' },
  { text: 'good food', size: 'xl' },
  { text: 'brings people', size: 'md', under: 'wave' },
  { text: 'together.', size: 'lg', tone: 'guac', burst: true },
]
const HEAD_QUOTE = [
  { text: "This isn't just", size: 'sm' },
  { text: 'a meal,', size: 'lg', tone: 'guac', under: 'wave' },
  { text: "it's", size: 'sm' },
  { text: 'your meal.', size: 'xl', burst: true },
]
const HEAD_CLOSE = [
  { text: "It's our way of making", size: 'sm', under: 'double' },
  { text: 'every meal count.', size: 'lg', under: 'dots' },
]
</script>

<template>
  <div class="val">
    <!-- 1. The belief -->
    <section class="v-intro" aria-labelledby="v-title">
      <DoodleHeadline id="v-title" tag="h1" class="lettered" :lines="HEAD_INTRO" />
    </section>

    <!-- 2. Fresh -->
    <section class="v-row" aria-labelledby="v-fresh">
      <img :src="IMG.bowl" alt="A Fresh Guacado bowl with grilled chicken, guacamole, corn, pico de gallo and sour cream" width="900" height="607" loading="lazy" />
      <div class="v-copy">
        <h2 id="v-fresh" class="v-h">We do it by keeping it <span class="brand__fresh">fresh</span></h2>
        <p>
          <span class="brand"><span class="brand__fresh">Fresh</span> Guacado</span> started with a simple idea: big Mexican flavors, made your way.
          <b>Our guacamole is mashed and mixed in-house, our sauces are homemade, and every bowl is built from our fresh selection of toppings.</b>
          It's more work. It's worth it.
        </p>
      </div>
    </section>

    <!-- 3. Lettered statement with the burrito -->
    <section class="v-quote" aria-label="Your meal, your way">
      <img :src="IMG.burrito" alt="" width="900" height="678" loading="lazy" />
      <DoodleHeadline tag="p" class="lettered lettered--quote" :lines="HEAD_QUOTE" />
    </section>

    <!-- 4. Facts -->
    <section class="v-facts" aria-labelledby="v-facts-t">
      <h2 id="v-facts-t" class="v-h v-h--center">Being fresh means real choices</h2>
      <ul>
        <li v-for="f in FACTS" :key="f.small"><b>{{ f.big }}</b><span>{{ f.small }}</span></li>
      </ul>
      <div class="v-facts__food" aria-hidden="true">
        <img :src="IMG.salad" alt="" width="900" height="773" loading="lazy" />
        <img :src="IMG.nachos" alt="" width="900" height="368" loading="lazy" />
      </div>
    </section>

    <!-- 5. Our people -->
    <section class="v-row v-row--flip" aria-labelledby="v-people">
      <img class="v-photo" :src="IMG.team" alt="The Fresh Guacado team at work on the line" width="1400" height="935" loading="lazy" />
      <div class="v-copy">
        <h2 id="v-people" class="v-h">Being fresh means treating our people right</h2>
        <p>Every meal is made by our crew, right in front of you. We're growing, and we're always looking for people who love good food and good service.</p>
        <a :href="links.jobs" class="v-btn" target="_blank" rel="noopener">Join our team<span class="sr-only"> (opens in a new tab)</span></a>
      </div>
    </section>

    <!-- 6. Close -->
    <section class="v-close" aria-labelledby="v-close-t">
      <DoodleHeadline id="v-close-t" tag="h2" class="lettered" :lines="HEAD_CLOSE" />
      <p>One bowl might not change the world, but the way we make it might change your day.</p>
      <button type="button" class="v-btn" @click="picker.show()">Order now</button>
    </section>
  </div>
</template>

<style scoped>
/* Warm paper background (chipotle.com/values) with the Guacado wax-paper pattern very faint. */
.val {
  --paper: #f3ede3;
  --brown: #3b2a1e;
  background-color: var(--paper);
  background-image: linear-gradient(rgba(243, 237, 227, 0.88), rgba(243, 237, 227, 0.88)), url('/media/wax-background.jpg');
  background-size: auto, auto 200px;
  color: var(--brown);
  overflow: hidden;
}
/* Lettered headlines are DoodleHeadline components; sizes and the draw-on live there. */
.lettered { color: var(--brown); }

.v-intro { padding: clamp(56px, 9vw, 120px) 16px clamp(32px, 5vw, 64px); }
.v-intro .lettered { transform: rotate(-3deg); }

.v-row { max-width: 1100px; margin: 0 auto; padding: clamp(24px, 4vw, 48px) 16px; display: grid; gap: 28px; align-items: center; }
@media (min-width: 860px) { .v-row { grid-template-columns: 1.1fr 1fr; gap: 56px; } .v-row--flip > :first-child { order: 2; } }
.v-row > img { width: 100%; height: auto; filter: drop-shadow(0 24px 30px rgba(59, 42, 30, 0.25)); }
.v-row > img.v-photo { filter: none; border-radius: 4px; box-shadow: 0 24px 40px -24px rgba(59, 42, 30, 0.5); }
.v-copy { display: grid; gap: 16px; justify-items: start; }
.v-h { font: 900 clamp(32px, 4.4vw, 54px)/0.95 var(--f-display); font-stretch: 72%; text-transform: uppercase; color: var(--brown); }
.v-h--center { text-align: center; }
.v-copy p { font-size: clamp(17px, 1.6vw, 21px); line-height: 1.45; }
.v-copy b { font-weight: 800; }

.v-quote { position: relative; max-width: 1100px; margin: 0 auto; padding: clamp(20px, 4vw, 40px) 16px clamp(48px, 7vw, 96px); display: grid; justify-items: center; }
.v-quote img { width: min(70%, 560px); height: auto; justify-self: end; transform: rotate(-8deg); filter: drop-shadow(0 24px 30px rgba(59, 42, 30, 0.3)); }
.lettered--quote { margin-top: clamp(-120px, -10vw, -40px); transform: rotate(-4deg); }

.v-facts { padding: clamp(40px, 6vw, 80px) 16px; background: rgba(0, 109, 68, 0.06); }
.v-facts ul { list-style: none; margin: 32px auto 0; padding: 0; max-width: 1000px; display: grid; gap: 24px; grid-template-columns: repeat(2, 1fr); }
@media (min-width: 860px) { .v-facts ul { grid-template-columns: repeat(4, 1fr); } }
.v-facts li { display: grid; justify-items: center; gap: 6px; text-align: center; }
.v-facts b { font: 900 clamp(56px, 7vw, 96px)/0.9 var(--f-display); font-stretch: 70%; color: var(--guac); }
.v-facts li span { font: 800 16px/1.15 var(--f-display); font-stretch: 85%; text-transform: uppercase; letter-spacing: 0.05em; }
.v-facts__food { display: flex; justify-content: center; align-items: center; gap: clamp(16px, 4vw, 48px); margin-top: 32px; }
.v-facts__food img { width: min(36%, 320px); height: auto; filter: drop-shadow(0 18px 22px rgba(59, 42, 30, 0.25)); }

.v-close { padding: clamp(56px, 8vw, 110px) 16px; display: grid; justify-items: center; gap: 20px; text-align: center; }
.v-close p { max-width: 46ch; font-size: 18px; }

.v-btn { border: 0; cursor: pointer; display: inline-flex; align-items: center; min-height: 50px; padding: 0 30px; border-radius: 3px; background: var(--guac); color: #fff; text-decoration: none; font: 900 18px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.04em; }
.v-btn:hover { background: var(--guac-dark); }
.v-btn:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
</style>
