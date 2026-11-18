<script setup>
import HeroPromo from '@/components/sections/HeroPromo.vue'
import OrderStrip from '@/components/sections/OrderStrip.vue'
import CategoryGrid from '@/components/sections/CategoryGrid.vue'
import FeatureDuo from '@/components/sections/FeatureDuo.vue'
import SidesTicker from '@/components/sections/SidesTicker.vue'
import FeaturedStrip from '@/components/sections/FeaturedStrip.vue'
import CrowdPleasers from '@/components/sections/CrowdPleasers.vue'
import JoinFranchise from '@/components/sections/JoinFranchise.vue'
</script>

<template>
  <!-- chipotle.com home order: hero > order strip > 3x3 categories > two story cards > Featured >
       Crowd pleasers > footer. Guacado's own sections (meal add-ons, finder, jobs) slot in between. -->
  <HeroPromo />
  <OrderStrip />
  <CategoryGrid />
  <FeatureDuo />
  <FeaturedStrip />
  <SidesTicker />
  <CrowdPleasers />
  <JoinFranchise />
</template>
