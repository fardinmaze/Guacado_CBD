<script setup>
import { guac } from '@/assets/illustrations'

// Flat Guacado-palette illustrations for the add-on cards. Chips & Guac reuses the owner's
// guac illustration; the others are simple drawings until real photography exists.
defineProps({ kind: { type: String, required: true } }) // chips | churros | lemonade | shake
</script>

<template>
  <img v-if="kind === 'chips'" :src="guac" alt="" width="160" height="160" loading="lazy" />

  <svg v-else-if="kind === 'churros'" viewBox="0 0 160 160" aria-hidden="true">
    <ellipse cx="80" cy="136" rx="56" ry="8" fill="#14231b" opacity=".08" />
    <g stroke="#8a4f12" stroke-width="2">
      <g transform="rotate(-28 80 84)"><rect x="52" y="30" width="22" height="92" rx="11" fill="#d99a43" /><path d="M56 42h14M56 56h14M56 70h14M56 84h14M56 98h14M56 112h14" stroke-linecap="round" /></g>
      <g transform="rotate(-4 80 84)"><rect x="70" y="26" width="22" height="96" rx="11" fill="#e0a64f" /><path d="M74 40h14M74 54h14M74 68h14M74 82h14M74 96h14M74 110h14" stroke-linecap="round" /></g>
      <g transform="rotate(22 80 84)"><rect x="90" y="30" width="22" height="92" rx="11" fill="#d99a43" /><path d="M94 42h14M94 56h14M94 70h14M94 84h14M94 98h14M94 112h14" stroke-linecap="round" /></g>
    </g>
    <g fill="#fff6e0"><circle cx="58" cy="52" r="1.8" /><circle cx="84" cy="44" r="1.8" /><circle cx="104" cy="60" r="1.8" /><circle cx="76" cy="96" r="1.8" /><circle cx="98" cy="102" r="1.8" /></g>
  </svg>

  <svg v-else-if="kind === 'lemonade'" viewBox="0 0 160 160" aria-hidden="true">
    <ellipse cx="80" cy="140" rx="46" ry="7" fill="#14231b" opacity=".08" />
    <path d="M104 18l-10 52" stroke="#006d44" stroke-width="7" stroke-linecap="round" />
    <path d="M42 40h76l-9 92a8 8 0 0 1-8 7H59a8 8 0 0 1-8-7z" fill="#fff" stroke="#14231b" stroke-width="3" stroke-linejoin="round" />
    <path d="M47 62h66l-6 70a8 8 0 0 1-8 7H61a8 8 0 0 1-8-7z" fill="#f4d94a" />
    <g fill="#fff" opacity=".7"><rect x="62" y="72" width="22" height="22" rx="4" transform="rotate(-10 73 83)" /><rect x="88" y="96" width="20" height="20" rx="4" transform="rotate(12 98 106)" /></g>
    <g transform="translate(118 44)"><circle r="19" fill="#c8d82c" /><circle r="14" fill="#f4f1a8" /><path d="M0-12V12M-12 0H12M-8.5-8.5L8.5 8.5M8.5-8.5L-8.5 8.5" stroke="#c8d82c" stroke-width="2" /></g>
  </svg>

  <svg v-else-if="kind === 'shake'" viewBox="0 0 160 160" aria-hidden="true">
    <ellipse cx="80" cy="142" rx="38" ry="7" fill="#14231b" opacity=".08" />
    <path d="M92 10l8 40" stroke="#be1323" stroke-width="6" stroke-linecap="round" />
    <path d="M48 52h64l-8 84a8 8 0 0 1-8 7H64a8 8 0 0 1-8-7z" fill="#f7efe0" stroke="#14231b" stroke-width="3" stroke-linejoin="round" />
    <path d="M52 78h56l-5 58a8 8 0 0 1-8 7H65a8 8 0 0 1-8-7z" fill="#e9c9a0" />
    <path d="M44 52c0-14 14-22 24-18 6-10 24-10 28 2 12-2 22 6 20 16z" fill="#fff" stroke="#14231b" stroke-width="3" stroke-linejoin="round" />
    <circle cx="84" cy="30" r="9" fill="#be1323" /><path d="M84 21c2-6 6-9 10-10" stroke="#006d44" stroke-width="3" fill="none" stroke-linecap="round" />
  </svg>
</template>

<style scoped>
img, svg { width: 100%; height: 100%; object-fit: contain; display: block; }
</style>
