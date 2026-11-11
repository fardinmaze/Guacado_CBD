<script setup>
import menu from '@/data/menu.json'
import { links, occasions, site } from '@/data/site'
import { tacos as tacosImg } from '@/assets/illustrations'

// "Crowd pleasers": two cards, centred title, wide action buttons (Chipotle layout).
// Colours are Guacado's: off-white kits card, green catering card. No prices here.
const kits = menu.familyKits
</script>

<template>
  <section class="crowd" aria-labelledby="crowd-title">
    <h2 id="crowd-title">Good food brings everyone together.</h2>
    <div class="crowd__grid">
      <article id="kits" class="cc cc--kits">
        <img class="cc__art" :src="tacosImg" alt="" width="420" height="275" loading="lazy" />
        <h3>Family kits</h3>
        <p>Feeding 4–6? Bring home two proteins, tortillas or chips, and all the fixings.</p>
        <ul class="cc__list">
          <li v-for="k in kits.items" :key="k.name">{{ k.name }}</li>
        </ul>
        <a :href="site.orderUrl" class="cc__btn">Order a family kit</a>
      </article>

      <article id="catering" class="cc cc--cater">
        <h3>Catering</h3>
        <p>From office lunches to celebrations, let's put together a spread your guests will love. Tell us your date and headcount.</p>
        <ul class="cc__tags" aria-label="Occasions we cater">
          <li v-for="o in occasions" :key="o">{{ o }}</li>
        </ul>
        <a :href="links.cateringPackages" class="cc__btn">See catering packages</a>
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
.cc { padding: clamp(22px, 3vw, 34px); display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; }
.cc__art { width: 200px; height: auto; }
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

/* Green card */
.cc--cater { background: var(--guac); color: var(--on-green); }
.cc--cater p { opacity: 0.92; }
.cc__tags { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
.cc__tags li { font-size: 12.5px; font-weight: 700; padding: 6px 12px; background: rgba(255, 255, 255, 0.14); border-radius: 999px; }
.cc--cater .cc__btn { background: var(--lime); color: var(--on-lime); }
.cc--cater .cc__btn:hover { background: #d8e83c; }
.cc__btn--alt { background: transparent !important; border: 2px solid currentColor; color: inherit !important; }
.cc--cater .cc__btn--alt:hover { background: #fff !important; color: var(--guac) !important; }
</style>
