<script setup>
import { stores } from '@/order/lib/catalog'
import { cityLine, mapsUrl } from '@/utils/format'

import { computed } from 'vue'
const props = defineProps({
  location: { type: Object, required: true }, // { address, city, state, zip, soon? }
})
// Order pickup here = start ordering at this restaurant (the location is already chosen).
const slug = computed(() => stores.find((s) => s.address === props.location.address && s.zip === props.location.zip)?.slug)
</script>

<template>
  <article class="loc" data-loc>
    <div class="loc__addr">
      <b>{{ location.address }}</b>
      <span>{{ cityLine(location) }}</span>
    </div>
    <span v-if="location.soon" class="soon">Coming soon</span>
    <span v-else class="open">Open daily, 10:30am to 3am</span>
    <div class="loc__actions">
      <RouterLink v-if="!location.soon && slug" :to="`/order/${slug}`" class="order">Order pickup</RouterLink>
      <a :href="mapsUrl(location)" target="_blank" rel="noopener" class="dir">
        Get directions<span class="sr-only"> to {{ location.address }}, opens Google Maps in a new tab</span>
      </a>
    </div>
  </article>
</template>

<style scoped>
.loc {
  display: grid;
  gap: 10px;
  padding: 18px;
  border-radius: var(--r-md);
  background: var(--surface-raised);
  box-shadow: var(--shadow-card);
}
.loc__addr { display: grid; gap: 2px; }
b { font-size: 16.5px; }
.loc__addr span { font-size: 14px; color: var(--ink-muted); }
.open { font-size: 13px; font-weight: 700; color: var(--accent-text); }
.soon { justify-self: start; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #fff; background: var(--chili); padding: 5px 10px; border-radius: var(--r-pill); }
.loc__actions { display: flex; gap: 8px; margin-top: 4px; }
.loc__actions a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 16px;
  border-radius: var(--r-pill);
  font-weight: 700;
  font-size: 14px;
  text-decoration: none;
}
.order { flex: 1; background: var(--guac); color: var(--on-green); }
.order:hover { background: var(--guac-dark); }
.dir { border: 1.5px solid var(--line); color: var(--ink); }
.dir:hover { border-color: var(--ink); }
</style>
