<script setup>
import { site } from '@/data/site'
</script>

<template>
  <!-- Thin utility strip above the header (accessibility link on the right). -->
  <div class="util">
    <div class="util__in">
      <span class="util__hours">{{ site.hoursBar }}</span>
      <a :href="site.accessibility" class="util__a11y">Accessibility</a>
    </div>
  </div>
</template>

<style scoped>
.util { background: #f0efec; color: var(--ink); font: 800 10px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.1em; }
.util__in { min-height: var(--util-h); display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 0 clamp(16px, 2.2vw, 36px); }
.util__hours { color: var(--ink-muted); }
.util__a11y { text-decoration: none; }
.util__a11y:hover { text-decoration: underline; }
@media (max-width: 520px) { .util__hours { display: none; } .util__in { justify-content: flex-end; } }
</style>
