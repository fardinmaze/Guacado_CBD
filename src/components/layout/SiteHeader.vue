<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { headerNav, nav, site } from '@/data/site'
import logo from '@/assets/logos/guacado-wordmark.webp'
import AppLink from '@/components/ui/AppLink.vue'
import MobileDrawer from './MobileDrawer.vue'

// Chipotle-style bar: logo and text nav on the left; location, order and bag on the right.
const open = ref(false)
const burger = ref(null)
const route = useRoute()

const links = headerNav.map((label) => nav.find((n) => n.label === label))

function close() {
  open.value = false
  burger.value?.focus() // return focus to the trigger
}

watch(() => route.fullPath, () => (open.value = false))
</script>

<template>
  <header id="top" class="hdr">
    <div class="hdr__in">
      <button
        ref="burger"
        class="burger"
        type="button"
        aria-label="Open menu"
        aria-controls="drawer"
        :aria-expanded="open"
        @click="open = true"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>

      <RouterLink class="hdr__logo" to="/" aria-label="Fresh Guacado Mexican Grill home">
        <img :src="logo" alt="Fresh Guacado Mexican Grill" width="168" height="40" />
      </RouterLink>

      <nav class="nav" aria-label="Main">
        <AppLink v-for="item in links" :key="item.label" :to="item.to" :href="item.href">{{ item.label }}</AppLink>
        <a :href="site.orderUrl">Order</a>
      </nav>

      <div class="hdr__actions">
        <RouterLink to="/locations" class="act act--find">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zm0-9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" /></svg>
          <span>Find a location</span>
        </RouterLink>
        <a :href="site.orderUrl" class="act act--order">Order pickup</a>
        <a :href="site.orderUrl" class="act act--bag" aria-label="Start an order">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M6 8h12l1 12H5L6 8z" /><path d="M9 10V7a3 3 0 0 1 6 0v3" /></svg>
        </a>
      </div>
    </div>
    <MobileDrawer :open="open" @close="close" />
  </header>
</template>

<style scoped>
.hdr {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--ground);
  box-shadow: 0 2px 6px rgba(20, 35, 27, 0.14);
}
.hdr__in { display: flex; align-items: center; gap: 12px; height: var(--header-h); padding: 0 clamp(16px, 2.2vw, 36px); }
.hdr__logo img { width: clamp(118px, 12vw, 150px); height: auto; }
.nav { display: none; gap: 30px; margin-left: 28px; }
.nav a {
  font: 900 20px/1 var(--f-display);
  font-stretch: 72%;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  text-decoration: none;
  color: var(--ink);
  padding: 6px 0;
  border-bottom: 3px solid transparent;
}
.nav a:hover, .nav a.router-link-active { border-bottom-color: var(--guac); }
.hdr__actions { margin-left: auto; display: flex; align-items: center; gap: 22px; }
.act { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; color: var(--ink); font: 800 14px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.08em; }
.act svg { width: 22px; height: 22px; }
.act--find { display: none; }
.act--find svg { color: var(--ink); width: 18px; height: 18px; }
.act--find:hover span { text-decoration: underline; }
.act--order { background: var(--guac); color: var(--on-green); padding: 12px 20px; border-radius: var(--r-btn); }
.act--order:hover { background: var(--guac-dark); }
.act--bag { display: none; }
.burger { width: 44px; height: 44px; margin-left: -8px; border: 0; background: transparent; color: var(--ink); display: grid; place-items: center; cursor: pointer; }
.burger svg { width: 26px; height: 26px; }
@media (min-width: 1000px) {
  .nav, .act--find, .act--bag { display: flex; }
  .burger { display: none; }
}
</style>
