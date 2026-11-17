<script setup>
import { site } from '@/data/site'
import { addOns } from '@/data/catalog'
import BaseButton from '@/components/ui/BaseButton.vue'
import AddOnArt from '@/components/ui/AddOnArt.vue'

const friesImg = '/media/menu/loaded-fries.webp' // owner photo (cut-out)

// "A little something on the side?": image cards, no prices. (Guac promo lives in FeatureDuo.)
const kindOf = (name) => (/chips/i.test(name) ? 'chips' : /churro/i.test(name) ? 'churros' : /lemonade/i.test(name) ? 'lemonade' : 'shake')
</script>

<template>
  <section class="band meal" aria-labelledby="meal-title">
    <div class="wrap">
      <h2 id="meal-title" class="display">A little something on the side?</h2>
      <p class="meal__lead">Add chips, guac, queso, fries or a drink to round out your order.</p>
      <img class="meal__hero" :src="friesImg" alt="Loaded fries topped with cheese, protein and fresh toppings" width="720" height="411" loading="lazy" decoding="async" />
      <ul class="meal__list">
        <li v-for="a in addOns" :key="a.name" class="meal__item">
          <span class="meal__img"><AddOnArt :kind="kindOf(a.name)" /></span>
          <b>{{ a.name }}</b>
          <span v-if="a.note" class="meal__note">{{ a.note }}</span>
        </li>
      </ul>
      <BaseButton :href="site.orderUrl" variant="dark">Add to your order</BaseButton>
    </div>
  </section>
</template>

<style scoped>
.meal { padding-block: clamp(40px, 5vw, 64px); }
.wrap { display: grid; gap: 22px; justify-items: center; text-align: center; max-width: 940px; }
h2 { font-size: clamp(34px, 4vw, 48px); }
.meal__lead { color: var(--ink-muted); max-width: 46ch; }
.meal__hero { width: clamp(240px, 42vw, 440px); height: auto; filter: drop-shadow(0 16px 20px rgba(20, 35, 27, 0.18)); }
.meal__list { list-style: none; margin: 0; padding: 0; width: 100%; display: grid; gap: 14px; grid-template-columns: repeat(2, 1fr); }
@media (min-width: 800px) { .meal__list { grid-template-columns: repeat(4, 1fr); gap: 20px; } }
.meal__item { display: grid; justify-items: center; align-content: start; gap: 8px; }
.meal__img { width: clamp(110px, 14vw, 150px); aspect-ratio: 1; border-radius: 50%; background: var(--surface); display: grid; place-items: center; padding: 14%; }
.meal__item b { font: 900 clamp(18px, 2vw, 22px)/1.1 var(--f-display); font-stretch: 72%; text-transform: uppercase; }
.meal__note { font-size: 12.5px; color: var(--ink-muted); max-width: 22ch; }
</style>
