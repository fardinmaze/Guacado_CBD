<script setup>
import { links, occasions, site } from '@/data/site'
// Owner photos: family kit spread (Contents/family kit guac.avif) and the group spread
// (Contents/group.jpeg, same file as the Sides banner, so it reuses that WebP).
const groupOrderImg = '/media/catering/group-order.webp'
const groupImg = '/media/sides/sides-main-900.webp'

// "Crowd pleasers": two cards, centred title, wide action buttons (Chipotle layout).
// Each card opens with a full-width photo. Off-white group order card; light green catering card whose
// photo fades into the card with a light green gradient (0% at the top to 100% at the bottom).
</script>

<template>
  <section class="crowd" aria-labelledby="crowd-title">
    <h2 id="crowd-title">Good food brings everyone together.</h2>
    <div class="crowd__grid">
      <!-- Group order: the ordering feature itself is still to come; the button starts a normal order. -->
      <article id="group" class="cc cc--kits">
        <span class="cc__media"><img :src="groupOrderImg" alt="Friends sharing burritos, bowls and chips from a Fresh Guacado bag" width="1200" height="509" loading="lazy" decoding="async" /></span>
        <h3>Group order</h3>
        <p>Ordering for the team or the whole crew? Everyone picks their own meal, and it all comes together in one pickup.</p>
        <ul class="cc__list">
          <li>Everyone builds their own meal</li>
          <li>Regular menu prices</li>
          <li>One order, one pickup</li>
        </ul>
        <RouterLink :to="{ path: '/order' }" class="cc__btn">Start a group order</RouterLink>
      </article>

      <article id="catering" class="cc cc--cater">
        <span class="cc__media cc__media--fade"><img :src="groupImg" alt="A catering spread of bowls, a taco salad, tacos and a burrito" width="900" height="720" loading="lazy" decoding="async" /></span>
        <h3>Catering</h3>
        <p>From office lunches to celebrations, let's put together a spread your guests will love. Tell us your date and headcount.</p>
        <ul class="cc__tags" aria-label="Occasions we cater">
          <li v-for="o in occasions" :key="o">{{ o }}</li>
        </ul>
        <RouterLink to="/catering" class="cc__btn">See catering packages</RouterLink>
        <a :href="`mailto:${site.email}?subject=Catering%20enquiry`" class="cc__btn cc__btn--alt">Email us</a>
      </article>
    </div>
  </section>
</template>

<style scoped>
.crowd { padding: clamp(40px, 5vw, 72px) 16px; display: grid; justify-items: center; gap: 28px; }
.crowd > h2 { font: 900 clamp(34px, 4vw, 48px)/1 var(--f-display); font-stretch: 72%; text-transform: uppercase; text-align: center; }
.crowd__grid { width: 100%; max-width: 940px; display: grid; gap: 18px; }
@media (min-width: 800px) { .crowd__grid { grid-template-columns: 1fr 1fr; gap: 24px; } }
.cc { --pad: clamp(22px, 3vw, 34px); padding: var(--pad); overflow: hidden; display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; }
/* Photo across the full card width, flush with the card's top and sides. */
.cc__media { position: relative; display: block; width: calc(100% + 2 * var(--pad)); margin: calc(-1 * var(--pad)) calc(-1 * var(--pad)) 6px; height: clamp(200px, 24vw, 250px); }
.cc__media img { display: block; width: 100%; height: 100%; object-fit: cover; }
.cc__media--fade::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(217, 235, 180, 0) 0%, rgba(217, 235, 180, 1) 100%); }
.cc h3 { font: 900 clamp(26px, 3vw, 34px)/1 var(--f-display); font-stretch: 72%; text-transform: uppercase; }
.cc p { font-size: 14px; line-height: 1.5; max-width: 40ch; }
.cc__btn { margin-top: auto; width: 100%; max-width: 300px; display: block; padding: 16px 10px; border-radius: 3px; text-decoration: none; font: 900 16px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.06em; }
.cc__btn--alt { margin-top: 0; padding: 14px 10px; }

/* Off-white card */
.cc--kits { background: var(--surface); color: var(--ink); }
.cc--kits p { color: var(--ink-muted); }
.cc__list { list-style: none; margin: 0; padding: 0; width: 100%; max-width: 320px; }
.cc__list li { padding: 9px 0; border-bottom: 1px solid var(--line); font-weight: 700; font-size: 15px; }
.cc--kits .cc__btn { background: var(--guac); color: var(--on-green); }
.cc--kits .cc__btn:hover { background: var(--guac-dark); }

/* Light green card (#d9ebb4, the same colour the photo gradient ends on) */
.cc--cater { background: #d9ebb4; color: var(--ink); }
.cc--cater p { color: var(--ink-muted); }
.cc__tags { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
.cc__tags li { font-size: 12.5px; font-weight: 700; padding: 6px 12px; background: rgba(255, 255, 255, 0.6); border-radius: 999px; }
.cc--cater .cc__btn { background: var(--guac); color: var(--on-green); }
.cc--cater .cc__btn:hover { background: var(--guac-dark); }
.cc__btn--alt { background: transparent !important; border: 2px solid currentColor; color: inherit !important; }
.cc--cater .cc__btn--alt:hover { background: var(--ink) !important; color: #fff !important; border-color: var(--ink); }
</style>
