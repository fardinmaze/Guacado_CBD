<script setup>
import BaseButton from '@/components/ui/BaseButton.vue'
</script>

<template>
  <section class="nf">
    <h1 class="display">That page isn't on the menu.</h1>
    <p>Looks like this page went missing. Head back home or find your nearest Guacado.</p>
    <div class="nf__btns">
      <BaseButton to="/" size="lg">Home</BaseButton>
      <BaseButton to="/locations" size="lg" variant="outline">Find a location</BaseButton>
    </div>
  </section>
</template>

<style scoped>
.nf { min-height: 60vh; display: grid; place-content: center; justify-items: center; gap: 18px; text-align: center; padding: 64px 20px; }
h1 { font-size: clamp(40px, 6vw, 80px); max-width: 16ch; }
p { color: var(--ink-muted); max-width: 44ch; }
.nf__btns { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
</style>
