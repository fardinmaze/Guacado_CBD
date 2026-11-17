<script setup>
import { computed } from 'vue'

// Brand name style: "Fresh Guacado", with "Fresh" picked out in the accent colour.
// <Brand /> renders the name on its own. <Brand :text="..." /> renders a sentence and
// styles every "Fresh Guacado" inside it (for copy that arrives as a string prop).
// Colour comes from --brand-fresh, so dark or green sections can switch it to lime.
const props = defineProps({ text: { type: String, default: 'Fresh Guacado' } })
const NAME = 'Fresh Guacado'
const parts = computed(() => props.text.split(/(Fresh Guacado)/))
</script>

<template>
  <template v-for="(p, i) in parts" :key="i">
    <span v-if="p === NAME" class="brand"><span class="brand__fresh">Fresh</span> Guacado</span>
    <template v-else>{{ p }}</template>
  </template>
</template>
