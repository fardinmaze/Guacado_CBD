<script setup>
import { advisory, site } from '@/data/site'
import CategoryGrid from '@/components/sections/CategoryGrid.vue'
import FeatureDuo from '@/components/sections/FeatureDuo.vue'
import FeaturedStrip from '@/components/sections/FeaturedStrip.vue'

// Menu page = chipotle.com's "#menu" block: a centred 3 x 3 flavor grid, the two story cards,
// the patterned Featured band, then the legal advisory. Dishes and options live in the ordering
// flow (/order), so every tile goes straight there; prices are shown at checkout.
</script>

<template>
  <CategoryGrid
    as="h1"
    eyebrow="Find your next favorite"
    title="Something delicious is waiting."
    intro="Explore bowls, tacos, burritos, sides and more. Found your favorite? Choose Order now to pick a location and place your pickup order."
  />
  <FeatureDuo />
  <FeaturedStrip eyebrow="Worth a craving" cta="Order pickup" :cta-to="{ path: '/order' }" />
  <p class="advisory"><span class="wrap">{{ advisory }}</span></p>
</template>

<style scoped>
.advisory { margin: 0; padding: 28px 0 40px; font-size: 12px; line-height: 1.6; color: var(--ink-muted); text-align: center; }
.advisory .wrap { display: block; max-width: 900px; }
</style>
