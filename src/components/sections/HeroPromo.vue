<script setup>
import { site } from '@/data/site'
import { videos } from '@/data/catalog'
import LoopVideo from '@/components/ui/LoopVideo.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

// Full-width media hero with a centred offer (Chipotle layout, Guacado content).
// Phones and small screens get the 720p cut, wider screens 1080p. The poster shows instantly.
const small = typeof matchMedia === 'function' && matchMedia('(max-width: 900px)').matches
const heroSrc = small ? videos.hero.sd : videos.hero.hd
</script>

<template>
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero__media">
      <LoopVideo :src="heroSrc" :poster="videos.hero.poster" label="Fresh Guacado menu favorites: bowls, tacos and more" />
    </div>
    <div class="hero__copy">
      <span class="hero__badge">Mexican favorites, made your way</span>
      <h1 id="hero-title">
        <span class="thin">Big Mexican Flavors</span>
        <span class="bold">Your Kind of Bowl.</span>
      </h1>
      <p class="hero__lead">Start with a base, choose your protein, pile on the toppings, and finish with a homemade sauce. Your bowl, your rules.</p>
      <div class="hero__btns">
        <BaseButton :href="site.orderUrl" size="md">Order pickup</BaseButton>
        <BaseButton to="/menu" size="md" variant="light">Explore the menu</BaseButton>
      </div>
      <p class="hero__fine">Pickup only. Your location confirms the final total at checkout.</p>
    </div>
  </section>
</template>

<style scoped>
.hero { position: relative; background: #000; color: #fff; min-height: max(420px, 70vh); min-height: max(420px, 70svh); display: grid; place-items: center; overflow: hidden; }
.hero__media { position: absolute; inset: 0; }
.hero__media :deep(video) { object-position: 50% 65%; }
/* No dark overlay on the video; a soft text shadow keeps the white copy readable. */
.hero__copy { position: relative; z-index: 1; text-shadow: 0 2px 12px rgba(0, 0, 0, 0.55); display: grid; justify-items: center; gap: 10px; text-align: center; padding: 28px 20px; max-width: 900px; }
.hero__btns { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.hero__badge { background: var(--guac); color: #fff; font: 800 15px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.08em; padding: 8px 18px; border-radius: 3px; }
h1 { display: grid; line-height: 0.92; text-transform: uppercase; font-family: var(--f-display); font-stretch: 100%; font-size: clamp(26px, 4.4vw, 64px); letter-spacing: 0.01em; }
h1 span { white-space: nowrap; }
.thin { font-weight: 700; font-stretch: 85%; }
.bold { font-weight: 900; font-stretch: 100%; color: var(--lime); }
.hero__sub { font: 800 clamp(16px, 1.5vw, 20px)/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.1em; }
.hero__lead { font-weight: 700; font-size: 16px; max-width: 54ch; line-height: 1.45; }
.hero__fine { font-size: 10px; line-height: 1.4; max-width: 44ch; opacity: 0.85; }
</style>
