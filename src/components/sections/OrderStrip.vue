<script setup>
import Brand from '@/components/ui/Brand.vue'
import { site } from '@/data/site'
import badge from '@/assets/logos/guacado-badge.webp'

// Strip under the hero (chipotle.com's "Join rewards" strip): logo, one invitation line, two CTAs.
// Its height is --strip-h so the header, hero and this strip fill the first screen.
// Guacado has no account system of its own, so "Create an account" goes to the online
// ordering storefront (order.online), where accounts live.
</script>

<template>
  <div class="strip">
    <div class="strip__in">
      <img :src="badge" alt="" width="80" height="82" />
      <p class="strip__t">Join Guacado Rewards. Unlock <span class="brand__fresh">Fresh</span> Guacado.</p>
      <a :href="site.orderUrl" class="strip__btn">Create an account</a>
      <span class="strip__or">or</span>
      <RouterLink to="/locations" class="strip__btn strip__btn--alt">Find <Brand /> near you</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.strip { background: var(--ground); border-bottom: 1px solid var(--line); }
.strip__in { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 10px 22px; min-height: var(--strip-h); padding: 10px 16px; }
.strip img { width: 72px; height: auto; }
.strip__t { font: 900 clamp(20px, 2.4vw, 30px)/1 var(--f-display); font-stretch: 72%; text-transform: uppercase; letter-spacing: 0.02em; }
.strip__btn { background: var(--ink); color: #fff; padding: 11px 22px; border: 2px solid var(--ink); border-radius: 3px; text-decoration: none; font: 800 15px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.05em; }
.strip__btn:hover { background: var(--guac); border-color: var(--guac); --brand-fresh: var(--lime); }
.strip__btn--alt { background: transparent; color: var(--ink); }
.strip__btn--alt:hover { color: #fff; }
.strip__or { font-size: 11px; text-transform: uppercase; color: var(--ink-muted); }
</style>
