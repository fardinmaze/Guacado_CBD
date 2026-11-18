<script setup>
import CategoryGrid from '@/components/sections/CategoryGrid.vue'
import FeatureDuo from '@/components/sections/FeatureDuo.vue'
import SidesTicker from '@/components/sections/SidesTicker.vue'
import FeaturedStrip from '@/components/sections/FeaturedStrip.vue'

// Menu page = chipotle.com's "#menu" block: a centred 3 x 3 flavor grid, the two story cards,
// the patterned Featured band, then Sides & dips. Dishes and options live in the ordering
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
  <SidesTicker />
</template>

