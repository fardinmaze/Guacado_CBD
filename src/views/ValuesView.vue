<script setup>
import { findItem } from '@/order/lib/catalog'
import { links, site } from '@/data/site'
import locationList from '@/data/locations.json'
import { locationStats } from '@/utils/locations'
import { useLocationPicker } from '@/composables/useLocationPicker'
import DoodleHeadline from '@/components/ui/DoodleHeadline.vue'
import LoopVideo from '@/components/ui/LoopVideo.vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
const picker = useLocationPicker()

// .v-reveal blocks unroll top to bottom once they scroll into view (CSS does the motion).
let revealIo
onMounted(() => {
  const els = document.querySelectorAll('.val .v-reveal')
  if (typeof IntersectionObserver !== 'function') return els.forEach((el) => el.classList.add('is-in'))
  revealIo = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return
      e.target.querySelectorAll(':scope > .v-reveal').forEach((el) => el.classList.add('is-in'))
      revealIo.unobserve(e.target)
    }),
    { threshold: 0.25 },
  )
  // watch the parent: a block clipped to zero height never reports as visible
  new Set([...els].map((el) => el.parentElement)).forEach((p) => revealIo.observe(p))
})
onBeforeUnmount(() => revealIo?.disconnect())

// Sticky bowl (chipotle.com/values): the bowl stays pinned while the words scroll past behind it.
// Scroll progress through the section (0 → 1) goes to --p, which turns and grows the bowl a little.
const stick = ref(null)
let stickRaf = 0
function stickProgress() {
  stickRaf = 0
  const el = stick.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)))
  el.style.setProperty('--p', p.toFixed(3))
}
const onStickScroll = () => { if (!stickRaf) stickRaf = requestAnimationFrame(stickProgress) }
onMounted(() => {
  if (typeof matchMedia !== 'function' || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  addEventListener('scroll', onStickScroll, { passive: true })
  stickProgress()
})
onBeforeUnmount(() => {
  removeEventListener('scroll', onStickScroll)
  cancelAnimationFrame(stickRaf)
})

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
  bowlGuac: '/media/values/bowl-guac.webp',
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
// Section order follows chipotle.com/values: hero, food + copy, video (fresh prep), ingredients,
// video (proteins), our people, close. Video claims only repeat what the site already says.
const group = (key) => byo.groups.find((g) => g.key === key).options
const HEAD_VIDEO_FRESH = [
  { text: 'Being fresh means…', size: 'sm', under: 'double' },
  { text: 'no freezers,', size: 'lg' },
  { text: 'no', size: 'md' },
  { text: 'microwaves.', size: 'xl', burst: true },
]
// Copy below is taken from the owner's brochure (Contents/Contents-5.pdf).
const VIDEO_FRESH_FACTS = [
  { mark: String(count('sauce')), text: 'Homemade sauces, from mango to habanero.' },
  { mark: String(count('toppings')), text: 'Fresh toppings, all prepped fresh daily.' },
  { mark: '0', text: 'Preservatives or pre-packaged foods. Just real, whole ingredients.' },
]
const HEAD_FACTS = [
  { text: 'Being fresh means', size: 'sm' },
  { text: 'real choices', size: 'lg', under: 'wave' },
]
// Ingredient ticker (chipotle.com runs its ingredients past in two rows): every build option with a photo.
const withImage = (keys) => keys.flatMap((k) => group(k)).filter((o) => o.image)
const TICKER = [withImage(['protein', 'rice', 'beans']), withImage(['toppings', 'sauce'])]
const HEAD_VIDEO_PROTEIN = [
  { text: 'Being fresh means…', size: 'sm' },
  { text: 'bold flavors,', size: 'lg' },
  { text: 'made to', size: 'md' },
  { text: 'order.', size: 'xl', under: 'wave' },
]
const PROTEIN_NAMES = group('protein').map((o) => o.name)
const HEAD_PEOPLE = [
  { text: 'Being fresh means…', size: 'sm' },
  { text: 'practicing the', size: 'md' },
  { text: 'art of', size: 'lg' },
  { text: 'hospitality.', size: 'xl', tone: 'guac', under: 'wave' },
]
// Sticky bowl section: big words (behind the bowl) and doodle notes (beside it). Note copy is
// from the owner's brochure (Contents/Contents-5.pdf), guest-facing lines only.
const STICK = [
  { word: 'Fresh.', side: 'l' },
  { side: 'r', icon: 'avocado', title: 'No freezers. No microwaves.', text: 'Just real, fresh, whole ingredients, prepared every day.' },
  { side: 'l', icon: 'knife', title: 'Prepped fresh daily', text: 'A menu free from preservatives and pre-packaged foods.' },
  { word: 'Bold.', side: 'r' },
  { side: 'l', icon: 'chili', title: 'Globally inspired', text: 'Mexican-inspired dishes taken to the next level with fresh, globally influenced ingredients and new, craveable flavors.' },
  { side: 'r', icon: 'flame', title: 'Chef-driven', text: 'Every dish is crafted to order, for the highest quality and flavor in every bite.' },
  { side: 'l', icon: 'heart', title: 'Great people', text: 'Great food, great people and a great culture, where guests and team members both feel valued.' },
]
// Hand-drawn icons (viewBox 64): each path draws on in turn when its note scrolls in.
const ICONS = {
  avocado: ['M32 6 C22 8 18 20 16 30 C12 46 20 58 32 58 C44 58 52 46 48 30 C46 20 42 8 32 6 Z', 'M32 30 C26 30 23 36 24 41 C25 47 30 49 33 48 C38 47 41 42 40 37 C39 33 36 30 32 30 Z', 'M30 6 C30 3 33 2 35 4'],
  knife: ['M8 44 L40 12 C44 8 50 10 50 14 L22 50 Z', 'M22 50 L30 58 L36 52 L28 44', 'M44 26 L48 30', 'M48 46 C52 46 56 50 56 54 M54 40 C58 42 60 46 60 50'],
  chili: ['M46 14 C56 18 56 32 48 42 C40 52 24 58 8 54 C8 46 16 44 22 42 C30 38 34 30 36 22 C38 15 41 12 46 14 Z', 'M44 12 C44 8 46 5 50 4', 'M42 12 C46 8 52 9 54 12'],
  flame: ['M32 6 C36 16 46 22 46 36 C46 46 40 52 32 52 C24 52 18 46 18 36 C18 28 24 24 26 16 C30 22 30 26 32 28 C34 22 34 14 32 6 Z', 'M32 52 C28 52 26 48 27 44 C28 40 32 38 32 34 C35 38 38 41 37 46 C36 50 34 52 32 52 Z', 'M12 58 L52 58', 'M16 62 L48 62'],
  heart: ['M32 54 C22 46 8 38 8 24 C8 14 16 8 24 10 C28 11 31 14 32 18 C33 14 36 11 40 10 C48 8 56 14 56 24 C56 38 42 46 32 54 Z', 'M20 20 C18 22 17 25 18 28', 'M50 6 L54 2 M56 12 L61 11 M52 9 L58 5'],
}
const HEAD_CLOSE = [
  { text: 'Our motto is simple', size: 'sm', under: 'double' },
  { text: 'Grill. Eat.', size: 'xl' },
  { text: 'Repeat.', size: 'xl', tone: 'guac', under: 'dots' },
]
</script>

<template>
  <div class="val">
    <!-- 1. The belief -->
    <section class="v-intro" aria-labelledby="v-title">
      <div class="v-intro__text">
        <DoodleHeadline id="v-title" tag="h1" class="lettered" :lines="HEAD_INTRO" :fit="2.2" />
      </div>
    </section>

    <!-- 2. Fresh -->
    <section class="v-row v-row--food" aria-labelledby="v-fresh">
      <img :src="IMG.bowl" alt="A Fresh Guacado salad bowl with grilled steak, romaine, pico de gallo and queso" width="1600" height="1372" loading="lazy" />
      <div class="v-copy">
        <h2 id="v-fresh" class="v-h">We do it by keeping it <span class="brand__fresh">fresh</span></h2>
        <p>
          <span class="brand"><span class="brand__fresh">Fresh</span> Guacado</span> is built around bold flavors, high-quality ingredients and a vibrant guest experience.
          <b>Every meal is made to order, our guac is mashed in-house, and everything is prepped fresh daily.</b>
          It's more than what's on your plate.
        </p>
      </div>
    </section>

    <!-- 3. Lettered statement with the burrito -->
    <section class="v-quote" aria-label="Your meal, your way">
      <img :src="IMG.burrito" alt="" width="1600" height="1202" loading="lazy" />
      <DoodleHeadline tag="p" class="lettered lettered--quote" :lines="HEAD_QUOTE" />
    </section>

    <!-- 4. Video: fresh prep (chipotle.com "making food fresh every day") -->
    <section class="v-video v-video--fresh" aria-labelledby="v-vfresh">
      <div class="v-video__media">
        <LoopVideo src="/media/values/fresh-prep.mp4" poster="/media/values/fresh-prep-poster.jpg" />
      </div>
      <div class="v-video__in">
        <!-- the title is pinned only inside this track, so it stops above the facts row -->
        <div class="v-video__track">
          <div class="v-video__head">
            <DoodleHeadline id="v-vfresh" tag="h2" class="lettered lettered--light" :lines="HEAD_VIDEO_FRESH" />
          </div>
        </div>
        <ul class="v-video__facts">
          <li v-for="f in VIDEO_FRESH_FACTS" :key="f.text">
            <span class="v-mark" aria-hidden="true">
              <b>{{ f.mark }}</b>
              <svg viewBox="0 0 120 80"><path d="M62 8 C20 4 4 30 12 52 C22 76 92 78 110 52 C124 30 98 6 52 12" pathLength="1" /></svg>
            </span>
            <span>{{ f.text }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- 5. Facts + ingredient ticker (chipotle.com "53 ingredients") -->
    <section class="v-facts" aria-labelledby="v-facts-t">
      <DoodleHeadline id="v-facts-t" tag="h2" class="lettered" :lines="HEAD_FACTS" />
      <ul>
        <li v-for="f in FACTS" :key="f.small"><b>{{ f.big }}</b><span>{{ f.small }}</span></li>
      </ul>
    </section>
    <div class="v-ticker" aria-label="Some of our ingredients" role="region">
      <div v-for="(row, r) in TICKER" :key="r" class="v-ticker__row">
        <ul class="v-ticker__track" :class="{ 'is-rev': r === 1 }">
          <li v-for="(o, i) in [...row, ...row]" :key="i" :aria-hidden="i >= row.length ? 'true' : undefined">
            <img :src="o.image" alt="" width="150" height="150" loading="lazy" />
            <span>{{ o.name }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- 6. Video: proteins (chipotle.com "being committed") -->
    <section class="v-video v-video--protein" aria-labelledby="v-vprotein">
      <div class="v-video__media">
        <LoopVideo src="/media/values/proteins.mp4" poster="/media/values/proteins-poster.jpg" />
      </div>
      <div class="v-video__in v-video__in--split">
        <DoodleHeadline id="v-vprotein" tag="h2" class="lettered lettered--light" :lines="HEAD_VIDEO_PROTEIN" />
        <div class="v-video__copy">
          <p><b>{{ PROTEIN_NAMES.slice(0, -1).join(', ') }} or {{ PROTEIN_NAMES.at(-1) }}.</b></p>
          <p>Chef-driven, Mexican-inspired dishes with bold, globally inspired flavors that keep you coming back. Pick one, go half and half, or double up.</p>
          <p class="v-stamp"><span>Double</span> protein? <span class="v-stamp__yes">Yes.</span></p>
        </div>
      </div>
    </section>

    <!-- 7. Our people (chipotle.com "treating our people right") -->
    <section class="v-people" aria-labelledby="v-people">
      <svg class="v-tear" viewBox="0 0 1440 40" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0H1440V18L1400 26 1352 14 1300 30 1246 16 1190 28 1130 12 1080 26 1020 18 968 32 910 14 856 26 800 16 744 30 690 14 632 28 578 18 520 32 466 16 410 28 352 14 298 30 240 18 186 28 130 14 76 26 30 16 0 24Z" />
      </svg>
      <div class="v-people__stage">
        <img class="v-people__photo" :src="IMG.team" alt="The Fresh Guacado team at work on the line" width="2000" height="1336" loading="lazy" />
        <!-- lettering and the copy card sit partly over the photo -->
        <div class="v-people__in">
          <DoodleHeadline id="v-people" tag="h2" class="lettered" :lines="HEAD_PEOPLE" />
          <!-- note card: bottom-right of the photo on desktop, overlapping the next section -->
          <div class="v-people__note">
            <div class="v-people__copy v-reveal">
              <p>Genuine connections, leading by example, and a place where <b>guests and team members both feel valued.</b></p>
              <p>We're growing, and we're always looking for people with a hospitality heart.</p>
              <a :href="links.jobs" class="v-arrow" target="_blank" rel="noopener">Join our team <span aria-hidden="true">→</span><span class="sr-only"> (opens in a new tab)</span></a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 8. Sticky bowl: pinned while the words scroll by behind it (chipotle.com/values) -->
    <section ref="stick" class="v-stick" aria-labelledby="v-stick-t">
      <h2 id="v-stick-t" class="sr-only">Fresh, bold, made to order</h2>
      <!-- the bowl is pinned only inside this track, so it comes to rest right on top of the last line -->
      <div class="v-stick__track">
      <div class="v-stick__pin" aria-hidden="true">
        <img :src="IMG.bowlGuac" alt="" width="1600" height="647" loading="lazy" decoding="async" />
      </div>
      <!-- scrolls past the pinned bowl: big words behind it, doodle notes beside it -->
      <div class="v-stick__flow">
        <template v-for="(b, i) in STICK" :key="i">
          <p v-if="b.word" class="v-word" :class="`v-word--${b.side}`" aria-hidden="true">{{ b.word }}</p>
          <div v-else class="v-note-wrap" :class="`v-note-wrap--${b.side}`">
            <div class="v-note v-reveal">
              <svg class="v-icon" :class="`v-icon--${b.icon}`" viewBox="0 0 64 64" aria-hidden="true">
                <path v-for="(d, k) in ICONS[b.icon]" :key="k" :d="d" pathLength="1" :style="{ transitionDelay: `${200 + k * 110}ms` }" />
              </svg>
              <h3 class="v-note__t">{{ b.title }}</h3>
              <svg class="v-note__line" viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true"><path d="M3 7 C60 2 110 11 160 6 S250 3 297 7" pathLength="1" /></svg>
              <p>{{ b.text }}</p>
            </div>
          </div>
        </template>
      </div>
      </div>
      <p class="v-word v-word--end" aria-hidden="true">Made to order.</p>
    </section>

    <!-- 9. Close -->
    <section class="v-close" aria-labelledby="v-close-t">
      <DoodleHeadline id="v-close-t" tag="h2" class="lettered" :lines="HEAD_CLOSE" />
      <p>Bold flavors, fresh ingredients and a high-energy experience, right in your neighborhood.</p>
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
  /* hand-drawn type, in the spirit of chipotle.com/values lettering */
  --f-doodle: 'Londrina Solid', var(--f-display);
  --f-doodle-sm: 'Permanent Marker', var(--f-display);
  --doodle-sm-k: 0.92;
  overflow-x: clip; /* not hidden: that would stop position: sticky in the video sections */
}
/* Lettered headlines are DoodleHeadline components; sizes and the draw-on live there. */
.lettered { color: var(--brown); }

/* Hero fills the first screen with the big lettered headline (DoodleHeadline :fit scales it to the box). */
.v-intro {
  /* under 900px the fixed Menu / Order pickup bar (MobileOrderBar, ~70px) covers the bottom */
  height: calc(100svh - var(--util-h) - var(--header-h) - 70px);
  min-height: 420px;
  padding: clamp(24px, 4vh, 56px) 16px;
  display: grid;
  overflow: hidden;
}
.v-intro__text { min-height: 0; display: grid; place-items: center; }
.v-intro .lettered { transform: rotate(-3deg); }
@media (min-width: 900px) {
  .v-intro { height: calc(100svh - var(--util-h) - var(--header-h)); min-height: 560px; padding: clamp(24px, 5vh, 64px) clamp(16px, 4vw, 64px); }
}

.v-row { max-width: 1100px; margin: 0 auto; padding: clamp(24px, 4vw, 48px) 16px; display: grid; gap: 28px; align-items: center; }
@media (min-width: 860px) { .v-row { grid-template-columns: 1.1fr 1fr; gap: 56px; } .v-row--flip > :first-child { order: 2; } }
.v-row > img { width: 100%; height: auto; filter: drop-shadow(0 24px 30px rgba(59, 42, 30, 0.25)); }
/* the bowl row runs wider, with the bowl taking most of it */
.v-row--food { max-width: 1400px; }
@media (min-width: 860px) {
  .v-row--food { grid-template-columns: 1.6fr 1fr; gap: 40px; }
  .v-row--food > img { width: 112%; margin-left: -8%; }
}
.v-row > img.v-photo { filter: none; border-radius: 4px; box-shadow: 0 24px 40px -24px rgba(59, 42, 30, 0.5); }
.v-copy { display: grid; gap: 16px; justify-items: start; }
.v-h { font: 900 clamp(36px, 4.8vw, 60px)/0.95 var(--f-doodle); font-stretch: 72%; text-transform: uppercase; color: var(--brown); }
.v-h--center { text-align: center; }
.v-copy p { font-size: clamp(17px, 1.6vw, 21px); line-height: 1.45; }
.v-copy b { font-weight: 800; }

.v-quote { position: relative; max-width: 1300px; margin: 0 auto; padding: clamp(20px, 4vw, 40px) 16px clamp(48px, 7vw, 96px); display: grid; justify-items: center; }
/* the burrito sits on top of the lettering, which tucks up under it: reads as the burrito lying on the words */
.v-quote img { position: relative; z-index: 2; width: min(96%, 900px); height: auto; justify-self: end; transform: rotate(-8deg); filter: drop-shadow(0 30px 26px rgba(59, 42, 30, 0.38)) drop-shadow(0 6px 6px rgba(59, 42, 30, 0.25)); }
.lettered--quote { position: relative; z-index: 1; margin-top: clamp(-130px, -9vw, -36px); transform: rotate(-4deg); }

.v-facts { padding: clamp(40px, 6vw, 80px) 16px; background: rgba(0, 109, 68, 0.06); }
.v-facts ul { list-style: none; margin: 32px auto 0; padding: 0; max-width: 1000px; display: grid; gap: 24px; grid-template-columns: repeat(2, 1fr); }
@media (min-width: 860px) { .v-facts ul { grid-template-columns: repeat(4, 1fr); } }
.v-facts li { display: grid; justify-items: center; gap: 6px; text-align: center; }
.v-facts b { font: 900 clamp(56px, 7vw, 96px)/0.9 var(--f-doodle); font-stretch: 70%; color: var(--guac); }
.v-facts li span { font: 800 16px/1.15 var(--f-display); font-stretch: 85%; text-transform: uppercase; letter-spacing: 0.05em; }

.v-facts .lettered { margin-bottom: 8px; }

/* ---------- Video sections (chipotle.com/values) ---------- */
.v-video { position: relative; color: #fff; isolation: isolate; }
.v-video__media { position: absolute; inset: 0; z-index: -1; background: #1d1611; }
.v-video__media::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(20, 14, 8, 0.45), rgba(20, 14, 8, 0.3) 40%, rgba(20, 14, 8, 0.55)); }
.lettered--light { color: #fff; text-shadow: 0 2px 18px rgba(0, 0, 0, 0.35); }

/* Fresh: tall section, the lettering stays pinned while the video scrolls past (like chipotle.com) */
.v-video--fresh { min-height: 150vh; }
.v-video__in { position: relative; max-width: 1200px; margin: 0 auto; padding: clamp(48px, 8vh, 96px) 16px; }
.v-video--fresh .v-video__in { min-height: 150vh; display: flex; flex-direction: column; justify-content: space-between; gap: 48px; }
.v-video__track { flex: 1; }
.v-video__head { position: sticky; top: calc(var(--header-h) + 6vh); }
.v-video__facts { flex: none; }
.v-video__facts { list-style: none; margin: 0 auto; padding: 0; display: grid; gap: 28px 48px; max-width: 1200px; }
@media (min-width: 760px) { .v-video__facts { grid-template-columns: repeat(3, 1fr); } }
.v-video__facts li { display: flex; align-items: center; gap: 18px; font: 700 clamp(16px, 1.5vw, 20px)/1.35 var(--f-body, inherit); }
.v-mark { position: relative; flex: none; width: 96px; height: 64px; display: grid; place-items: center; }
.v-mark b { font: 900 44px/1 var(--f-doodle); font-stretch: 72%; }
.v-mark svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.v-mark path { fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; }

/* Proteins: one screen, lettering left, copy right */
.v-video--protein { min-height: min(100vh, 820px); display: grid; align-items: center; }
.v-video__in--split { display: grid; gap: 32px; align-items: center; width: 100%; }
@media (min-width: 860px) { .v-video__in--split { grid-template-columns: 1.2fr 1fr; gap: 64px; } }
.v-video__copy { display: grid; gap: 14px; justify-items: start; max-width: 42ch; font-size: clamp(17px, 1.5vw, 20px); line-height: 1.45; }
.v-video__copy b { font-weight: 800; }
.v-stamp { margin-top: 8px; font: 900 clamp(26px, 2.6vw, 36px)/1 var(--f-doodle); font-stretch: 72%; text-transform: uppercase; }
.v-stamp > span:first-child { text-decoration: underline; text-decoration-thickness: 3px; text-underline-offset: 6px; }
.v-stamp__yes { display: inline-block; margin-left: 6px; padding: 6px 12px 4px; border: 3px solid currentColor; border-radius: 50% 46% 52% 44% / 56% 50% 46% 52%; transform: rotate(-6deg); color: #b9e07a; }

/* ---------- Ingredient ticker ---------- */
.v-ticker { padding: 8px 0 clamp(40px, 6vw, 80px); background: rgba(0, 109, 68, 0.06); display: grid; gap: 8px; }
.v-ticker__row { overflow: hidden; }
.v-ticker__track { list-style: none; margin: 0; padding: 0; display: flex; width: max-content; animation: v-ticker 60s linear infinite; }
.v-ticker__track.is-rev { animation-direction: reverse; }
.v-ticker:hover .v-ticker__track { animation-play-state: paused; }
@keyframes v-ticker { to { transform: translateX(-50%); } }
.v-ticker li { position: relative; width: 150px; display: grid; justify-items: center; }
.v-ticker img { width: 132px; height: 132px; object-fit: contain; transition: transform 0.25s; }
.v-ticker span { margin-top: -6px; font: 800 13px/1.1 var(--f-display); font-stretch: 85%; text-transform: uppercase; letter-spacing: 0.04em; text-align: center; opacity: 0; transition: opacity 0.2s; }
.v-ticker li:hover img { transform: scale(1.08); }
.v-ticker li:hover span { opacity: 1; }
@media (hover: none) { .v-ticker span { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .v-ticker__track { animation: none; } .v-ticker__row { overflow-x: auto; } }

/* ---------- Our people: torn paper edge into white, lettering + copy, full-width photo ---------- */
.v-people { position: relative; background: #fff; padding-top: clamp(64px, 8vw, 112px); }
/* white paper torn upward over the video above */
.v-tear { position: absolute; top: 1px; left: 0; width: 100%; height: clamp(18px, 2.6vw, 40px); fill: #fff; transform: translateY(-100%) scaleY(-1); }
/* Photo and text overlap: on phones the text card pulls up over the photo's bottom; on desktop
   the photo fills the right ~70% and the lettering + card overlap its left edge. */
.v-people { padding-bottom: 0; }
.v-people__stage { position: relative; }
.v-people__in { position: relative; z-index: 1; margin: -96px 16px 0; display: grid; gap: 20px; }
.v-people__copy { background: #fff; padding: 22px 24px 26px; border-radius: 3px; box-shadow: 0 22px 44px -22px rgba(59, 42, 30, 0.45); transform: rotate(-1.2deg); }
.v-people .lettered { background: var(--paper); padding: 18px 12px 22px; border-radius: 3px; box-shadow: 0 18px 36px -20px rgba(59, 42, 30, 0.4); }
@media (min-width: 900px) {
  /* full-width photo; the text column starts above it on the white and runs down over its left side */
  .v-people__stage { display: grid; }
  .v-people__photo { grid-area: 1 / 1; margin-top: clamp(150px, 15vw, 260px); }
  .v-people__in { grid-area: 1 / 1; align-self: start; width: min(46%, 720px); margin: 0 0 0 clamp(16px, 5vw, 96px); gap: 28px; justify-items: start; }
  .v-people .lettered { background: none; box-shadow: none; padding: 0; }
  /* white "sticker" outline keeps the lettering readable where it crosses the photo */
  .v-people .lettered :deep(.ch) { -webkit-text-stroke: 0.14em #fff; paint-order: stroke fill; }
  .v-people .lettered :deep(.d-sm .ch) { -webkit-text-stroke-width: 0.2em; }
  .v-people .lettered :deep(.ink) { stroke-width: 4; filter: drop-shadow(0 0 2px #fff) drop-shadow(0 0 2px #fff); }
  .v-people__copy { max-width: 46ch; }
  .v-people__in { position: static; }
  .v-people .lettered { position: relative; z-index: 1; }
  /* bottom-right of the photo, hanging over into the closing section (like the lettering hangs over the top) */
  .v-people__note { position: absolute; z-index: 2; right: clamp(16px, 5vw, 96px); bottom: calc(-1 * clamp(70px, 8vw, 140px)); }
  .v-people + .v-stick { padding-top: clamp(70px, 8vw, 140px); } /* room for the note card hanging over */
}
.v-people .lettered { transform: rotate(-4deg); }
.v-people__copy { display: grid; gap: 14px; justify-items: start; font-size: clamp(17px, 1.5vw, 20px); line-height: 1.45; }
.v-people__copy b { font-weight: 800; }
.v-arrow { font: 400 18px/1 var(--f-doodle-sm); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.06em; color: var(--brown); text-decoration: none; border-bottom: 2px solid currentColor; padding-bottom: 4px; }
.v-arrow:hover { color: var(--guac); }
.v-arrow:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
.v-people__photo { display: block; width: 100%; height: clamp(300px, 62vw, 520px); object-fit: cover; object-position: 50% 35%; }
@media (min-width: 900px) {
  .v-people__photo { height: clamp(420px, 52vw, 860px); -webkit-mask-image: linear-gradient(180deg, transparent, #000 18%); mask-image: linear-gradient(180deg, transparent, #000 18%); }
}
/* note card unrolls from top to bottom when it scrolls into view */
.v-reveal { clip-path: inset(0 0 100% 0); transition: clip-path 0.9s cubic-bezier(0.6, 0.05, 0.3, 1) 0.4s; }
.v-reveal.is-in { clip-path: inset(-20px -20px -40px -20px); }
.v-note.v-reveal { transition-duration: 0.45s; transition-delay: 0s; }
@media (prefers-reduced-motion: reduce) { .v-reveal { clip-path: none; transition: none; } }

/* ---------- Sticky bowl ---------- */
/* The section is several screens tall; the pin sticks to the top for all of it while the
   words (absolutely placed down the full height, behind the bowl) scroll up past it. */
/* --bowl-h follows the photo's 1600 x 647 shape. The pin is exactly the bowl's height, so when
   the track ends the bowl stops just above "Made to order." */
.v-stick { --p: 0.5; --bowl-w: min(48vw, 760px); --bowl-h: calc(var(--bowl-w) * 0.405); position: relative; padding-bottom: clamp(48px, 6vw, 96px); }
.v-stick__track { position: relative; }
.v-stick__pin { position: sticky; top: calc(var(--header-h) + 3svh); z-index: 2; height: var(--bowl-h); display: grid; place-items: center; pointer-events: none; }
.v-stick__pin img {
  width: var(--bowl-w); height: auto;
  transform: rotate(calc(-6deg + var(--p) * 10deg)) scale(calc(0.92 + var(--p) * 0.1));
  filter: drop-shadow(0 36px 34px rgba(59, 42, 30, 0.35)) drop-shadow(0 8px 8px rgba(59, 42, 30, 0.2));
  will-change: transform;
}
/* starts level with the bowl (behind it) and sets the track's height */
.v-stick__flow { position: relative; margin-top: calc(-1 * var(--bowl-h)); display: grid; row-gap: 9svh; padding: calc(var(--bowl-h) * 0.7) clamp(16px, 5vw, 96px) 4svh; }
.v-word { position: relative; z-index: 1; margin: 0; font: 900 clamp(84px, 17vw, 260px)/0.85 var(--f-doodle); font-stretch: 70%; text-transform: uppercase; color: var(--brown); white-space: nowrap; }
.v-word--l { justify-self: start; transform: rotate(-5deg); color: var(--guac); }
.v-word--r { justify-self: end; transform: rotate(4deg); }
.v-word--end { margin-top: 2svh; text-align: center; font-size: clamp(56px, 12vw, 190px); transform: rotate(-3deg); color: var(--guac); }
/* notes sit beside the bowl and in front of it */
.v-note-wrap { position: relative; z-index: 3; width: min(30vw, 400px); }
.v-note-wrap--l { justify-self: start; }
.v-note-wrap--r { justify-self: end; }
.v-note { display: grid; gap: 8px; justify-items: start; }
.v-note-wrap--l .v-note { transform: rotate(-1.5deg); }
.v-note-wrap--r .v-note { transform: rotate(1.5deg); }
.v-note__t { margin: 6px 0 0; font: 400 clamp(22px, 2vw, 30px)/1.1 var(--f-doodle-sm); color: var(--brown); }
.v-note p { margin: 0; font-size: clamp(16px, 1.3vw, 19px); line-height: 1.5; }
.v-note__line { width: min(260px, 80%); height: 12px; overflow: visible; }
.v-note__line path, .v-icon path { fill: none; stroke: var(--guac); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; stroke-dasharray: 1 2; stroke-dashoffset: 1; transition: stroke-dashoffset 0.45s cubic-bezier(0.6, 0.05, 0.3, 1); }
.v-note__line path { transition-delay: 0.5s; stroke: var(--brown); stroke-width: 2.5; }
.is-in .v-note__line path, .is-in .v-icon path { stroke-dashoffset: 0; }
/* icons draw on, then keep a small hand-drawn wobble going */
.v-icon { width: clamp(64px, 6vw, 88px); height: auto; aspect-ratio: 1; overflow: visible; }
.is-in .v-icon { animation: v-wobble 2.6s ease-in-out 1.1s infinite; }
.is-in .v-icon--flame, .is-in .v-icon--heart { animation-name: v-pulse; animation-duration: 1.6s; }
@keyframes v-wobble { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
@keyframes v-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.12); } }
@media (max-width: 760px) {
  .v-stick { --bowl-w: 84vw; }
  /* notes cross the bowl here, so leave the bowl its own space at the end to land in */
  .v-stick__flow { row-gap: 7svh; padding-bottom: calc(var(--bowl-h) + 7svh); }
  .v-word { white-space: normal; text-align: center; justify-self: center; }
  /* on phones the notes cross the bowl, so they get a paper card */
  .v-note-wrap { width: 100%; }
  .v-note { background: rgba(243, 237, 227, 0.94); padding: 16px 18px 18px; border-radius: 4px; box-shadow: 0 16px 30px -18px rgba(59, 42, 30, 0.45); }
}
@media (prefers-reduced-motion: reduce) {
  .is-in .v-icon { animation: none; }
  .v-note__line path, .v-icon path { transition: none; }
}

.v-close { padding: clamp(56px, 8vw, 110px) 16px; display: grid; justify-items: center; gap: 20px; text-align: center; }
.v-close p { max-width: 46ch; font-size: 18px; }

.v-btn { border: 0; cursor: pointer; display: inline-flex; align-items: center; min-height: 50px; padding: 0 30px; border-radius: 3px; background: var(--guac); color: #fff; text-decoration: none; font: 900 22px/1 var(--f-doodle); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.04em; }
.v-btn:hover { background: var(--guac-dark); }
.v-btn:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
</style>
