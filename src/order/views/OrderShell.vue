<script setup>
import { useRoute } from 'vue-router'
import { advisory } from '@/order/lib/catalog'
import OrderHeader from '@/order/components/OrderHeader.vue'
import BagSheet from '@/order/components/BagSheet.vue'

// Frame for every /order page: its own slim header (the marketing header and footer are hidden).
// Routes with meta.wide (the builder's card grid) get a wider column.
const route = useRoute()
</script>

<template>
  <div class="shell">
    <OrderHeader />
    <main id="main" class="shell__main" :class="{ wide: route.meta.wide }">
      <RouterView />
      <p class="shell__adv">{{ advisory }}</p>
    </main>
    <BagSheet />
  </div>
</template>

<style scoped>
.shell { min-height: 100svh; background: var(--ground); }
.shell__main { max-width: 720px; margin: 0 auto; padding: 20px var(--gut-r) 140px var(--gut-l); }
.shell__main.wide { max-width: 1120px; }
.shell__adv { margin-top: 40px; font-size: 12px; line-height: 1.5; color: var(--ink-muted); }
</style>
