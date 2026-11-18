<script setup>
import { computed, ref } from 'vue'
import { useLocationPicker } from '@/composables/useLocationPicker'

// "Feeding a crew?" planner for the Group order card (inspired by atlwingspot.com). The guest
// picks how many people and how hungry; only then does a mixed spread to start from appear. Rough guide only: entrées per person by hunger, chips & dips to share,
// a drink each. "Order now" opens the location picker like every other order button.
const picker = useLocationPicker()
const people = ref(8)
const hunger = ref('')
const LEVELS = [
  { id: 'snacky', label: 'Snacky', perPerson: 0.75, chipsPer: 6 },
  { id: 'hungry', label: 'Hungry', perPerson: 1, chipsPer: 4 },
  { id: 'starving', label: 'Starving', perPerson: 1.5, chipsPer: 3 },
]
const level = computed(() => LEVELS.find((l) => l.id === hunger.value))
const spread = computed(() => {
  if (!level.value) return []
  const n = people.value
  const mains = Math.max(1, Math.round(n * level.value.perPerson))
  const tacos = Math.max(2, Math.round(mains * 0.5) * 2)
  const bowls = Math.max(1, Math.ceil(mains * 0.5))
  return [
    { n: bowls, label: bowls === 1 ? 'bowl or burrito' : 'bowls & burritos' },
    { n: tacos, label: 'tacos' },
    { n: Math.max(1, Math.ceil(n / level.value.chipsPer)), label: 'chips & dips' },
    { n, label: n === 1 ? 'drink' : 'drinks' },
  ]
})

const setPeople = (n) => (people.value = Math.min(100, Math.max(2, n)))
const pad = (n) => String(n).padStart(2, '0')
</script>

<template>
  <div class="crew">
    <p class="crew__q">Feeding a crew?</p>
    <div class="crew__row">
      <span class="crew__l" id="crew-ppl">How many people</span>
      <div class="crew__step" role="group" aria-labelledby="crew-ppl">
        <button type="button" aria-label="Fewer people" :disabled="people <= 2" @click="setPeople(people - 1)">−</button>
        <output aria-live="polite">{{ pad(people) }}</output>
        <button type="button" aria-label="More people" :disabled="people >= 100" @click="setPeople(people + 1)">+</button>
      </div>
    </div>
    <div class="crew__row crew__row--col">
      <span class="crew__l" id="crew-hun">and how hungry</span>
      <div class="crew__seg" role="radiogroup" aria-labelledby="crew-hun">
        <button v-for="l in LEVELS" :key="l.id" type="button" role="radio" :aria-checked="hunger === l.id" @click="hunger = l.id">{{ l.label }}</button>
      </div>
    </div>

    <div class="crew__out" aria-live="polite">
      <template v-if="level">
        <p class="crew__start">Start with about</p>
        <ul class="crew__list">
          <li v-for="s in spread" :key="s.label"><b>{{ s.n }}</b> {{ s.label }}</li>
        </ul>
      </template>
      <p v-else class="crew__hint">Pick how hungry, and we'll plate up a starting point.</p>
    </div>

    <button type="button" class="crew__go" @click="picker.show()">Start a group order</button>
    <p class="crew__fine">It's a starting point, not a rule. You know your crew better than we do.</p>
  </div>
</template>

<style scoped>
.crew { display: grid; gap: 10px; justify-items: center; width: 100%; max-width: 340px; }
.crew__q { font: 900 22px/1 var(--f-display); font-stretch: 76%; text-transform: uppercase; color: var(--accent-text); }
.crew__row { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; }
.crew__row--col { flex-direction: column; align-items: stretch; }
.crew__l { font-size: 13px; font-weight: 700; color: var(--ink-muted); text-align: left; }
.crew__step { display: inline-flex; align-items: center; border: 1.5px solid var(--line); border-radius: 999px; background: #fff; }
.crew__step button { width: 40px; height: 40px; border: 0; background: none; font: 700 20px/1 var(--f-body); color: var(--ink); cursor: pointer; border-radius: 50%; }
.crew__step button:disabled { opacity: 0.35; cursor: not-allowed; }
.crew__step output { min-width: 40px; text-align: center; font: 900 22px/1 var(--f-display); font-stretch: 80%; }
.crew__seg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 4px; border: 1.5px solid var(--line); border-radius: 999px; background: #fff; }
.crew__seg button { min-height: 38px; border: 0; border-radius: 999px; background: none; color: var(--ink-muted); font: 900 14px/1 var(--f-display); font-stretch: 82%; text-transform: uppercase; letter-spacing: 0.04em; cursor: pointer; transition: background-color 0.2s, color 0.2s; }
.crew__seg button[aria-checked='true'] { background: var(--guac); color: #fff; }
.crew__step button:focus-visible, .crew__seg button:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

.crew__out { min-height: 64px; display: grid; justify-items: center; align-content: start; gap: 6px; }
.crew__start { font: 800 12px/1 var(--f-display); font-stretch: 85%; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-muted); }
.crew__list { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 14px; font-size: 14px; }
.crew__list b { font: 900 24px/1 var(--f-display); font-stretch: 80%; color: var(--guac); }
.crew__hint { font-size: 13px; color: var(--ink-muted); max-width: 30ch; }
.crew__go { width: 100%; max-width: 300px; min-height: 50px; border: 0; border-radius: 3px; background: var(--guac); color: #fff; font: 900 16px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.06em; cursor: pointer; }
.crew__go:hover { background: var(--guac-dark); }
.crew__go:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.crew__fine { font-size: 11.5px; color: var(--ink-muted); max-width: 34ch; }
@media (prefers-reduced-motion: reduce) { .crew__seg button { transition: none; } }
</style>
