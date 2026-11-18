<script setup>
import { computed, nextTick, ref } from 'vue'

// One ingredient card, laid out like chipotle.com/order/build: photo bleeding off the left edge,
// then NAME, an optional note ("Includes guacamole", "Mild") and "price   cal". Picked cards get
// a coloured border and a badge on the photo: a tick, or a text badge ("1/2" half and half,
// "1x" / "2x" with Double protein). `radio` draws the photo-less Double card (empty circle). The ⋮
// button slides an options panel over the card (Light / Normal / Extra / Side, or Normal /
// Double for protein); "‹" closes it. `none` draws the ⊘ "No rice" / "No beans" card.
const props = defineProps({
  name: { type: String, required: true },
  image: { type: String, default: '' },
  note: { type: String, default: '' },
  cal: { type: Number, default: null },
  price: { type: String, default: '' },
  picked: { type: Boolean, default: false },
  badge: { type: String, default: '' }, // text in the badge instead of a tick
  radio: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  none: { type: Boolean, default: false },
  levels: { type: Array, default: () => [] }, // [{ value, label }]; empty = no ⋮ button
  level: { type: String, default: 'regular' },
})
const emit = defineEmits(['pick', 'level'])

const open = ref(false)
const panel = ref(null)
const more = ref(null)
const calText = computed(() => (props.cal != null ? `${props.cal} cal` : ''))
async function openPanel() {
  open.value = true
  await nextTick()
  panel.value?.querySelector('[aria-checked="true"], [role="radio"]')?.focus()
}
async function closePanel() {
  open.value = false
  await nextTick()
  more.value?.focus()
}
function choose(value) {
  emit('level', value)
  closePanel()
}
function onKey(e) {
  if (e.key === 'Escape') return closePanel()
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
  if (!step) return
  e.preventDefault()
  const i = props.levels.findIndex((l) => l.value === props.level)
  emit('level', props.levels[(i + step + props.levels.length) % props.levels.length].value)
}
</script>

<template>
  <li class="bc" :class="{ on: picked, off: disabled && !picked, none, radio }">
    <button type="button" class="bc__btn" :aria-pressed="picked" :disabled="disabled && !picked" @click="emit('pick')">
      <span class="bc__img">
        <span v-if="radio" class="bc__radio" aria-hidden="true"><svg v-if="picked" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10" /></svg></span>
        <svg v-else-if="none" class="bc__no" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" stroke-width="4" /><path d="M10 10l28 28" stroke="currentColor" stroke-width="4" /></svg>
        <img v-else :src="image" alt="" width="360" height="360" loading="lazy" decoding="async" />
        <span v-if="picked && !radio" class="bc__badge" :class="{ half: !!badge }" aria-hidden="true">
          <template v-if="badge">{{ badge }}</template>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10" /></svg>
        </span>
      </span>
      <span class="bc__txt">
        <span class="bc__name">{{ name }}<span v-if="badge" class="sr-only"> ({{ badge === '1/2' ? 'half portion' : badge === '2x' ? 'double portion' : 'full portion' }})</span></span>
        <span v-if="note" class="bc__note">{{ note }}</span>
        <span v-if="price || calText" class="bc__meta">
          <span v-if="price">{{ price }}</span>
          <span v-if="calText">{{ calText }}</span>
        </span>
      </span>
    </button>

    <button
      v-if="levels.length"
      ref="more"
      type="button"
      class="bc__more"
      :aria-label="`${name} options`"
      :aria-expanded="open"
      @click="openPanel"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
    </button>

    <div v-if="open" ref="panel" class="bc__panel" role="radiogroup" :aria-label="`How much ${name}`" @keydown="onKey">
      <button
        v-for="l in levels"
        :key="l.value"
        type="button"
        role="radio"
        class="bc__opt"
        :aria-checked="picked && level === l.value"
        :tabindex="level === l.value ? 0 : -1"
        @click="choose(l.value)"
      >
        {{ l.label }}
      </button>
      <button type="button" class="bc__close" aria-label="Close options" @click="closePanel">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
    </div>
  </li>
</template>

<style scoped>
.bc { position: relative; min-width: 0; }
.bc__btn {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  min-height: 116px;
  padding: 0 52px 0 0;
  border: 1px solid #d6d1c6;
  background: #fff;
  color: var(--ink);
  text-align: left;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.bc__btn:hover:not(:disabled) { border-color: var(--ink-muted); }
.bc__btn:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.bc__btn:disabled { opacity: 0.45; cursor: not-allowed; }
.bc.on .bc__btn { border: 2px solid var(--guac); box-shadow: inset 0 0 0 1px var(--guac); }

/* Photo: a fixed slot on the left; the cut-out is scaled up so it bleeds off the card edge. */
.bc__img { position: relative; flex: none; width: 106px; height: 114px; display: grid; place-items: center; }
.bc__img img { width: 100%; height: 100%; object-fit: cover; transform: scale(1.32) translateX(-8%); }
.bc__no { width: 46px; height: 46px; color: #c8bfb0; }
.bc__radio { width: 40px; height: 40px; border-radius: 50%; border: 1.5px solid #c8bfb0; background: #fff; display: grid; place-items: center; color: #fff; }
.bc__radio svg { width: 20px; height: 20px; }
.bc.radio.on .bc__radio { background: var(--guac); border-color: var(--guac); }
.bc.radio .bc__btn { background: #f1eee7; }
.bc__badge { position: absolute; top: 50%; left: 50%; width: 40px; height: 40px; margin: -20px 0 0 -20px; border-radius: 50%; display: grid; place-items: center; background: var(--guac); color: #fff; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25); }
.bc__badge svg { width: 20px; height: 20px; }
.bc__badge.half { background: var(--lime); color: var(--on-lime); font: 900 15px/1 var(--f-display); font-stretch: 85%; letter-spacing: 0.02em; }

.bc__txt { display: grid; gap: 3px; min-width: 0; padding: 12px 0; }
.bc__name { font: 900 19px/1.05 var(--f-display); font-stretch: 78%; text-transform: uppercase; letter-spacing: 0.01em; }
.bc__note { font-size: 13px; color: var(--ink-muted); }
.bc__meta { display: flex; flex-wrap: wrap; gap: 2px 18px; margin-top: 2px; font-size: 14px; font-weight: 700; color: var(--ink-muted); }

/* ⋮ button, right edge */
.bc__more { position: absolute; top: 50%; right: 6px; width: 40px; height: 44px; margin-top: -22px; border: 0; background: none; color: #aaa294; display: grid; place-items: center; cursor: pointer; border-radius: 6px; }
.bc__more svg { width: 20px; height: 20px; fill: currentColor; }
.bc__more:hover { color: var(--ink); }
.bc__more:focus-visible { outline: 3px solid var(--focus); outline-offset: -2px; }

/* Options panel over the card: segmented choices + "‹" to close. */
.bc__panel { position: absolute; inset: 0; z-index: 2; display: flex; border: 1px solid #d6d1c6; background: #fff; }
.bc__opt { flex: 1; min-width: 0; border: 0; border-right: 1px solid #e3ded3; background: #f1eee7; color: var(--ink); font: 700 13px/1.15 var(--f-body); padding: 4px; cursor: pointer; }
.bc__opt[aria-checked='true'] { background: var(--guac); color: #fff; }
.bc__opt:hover:not([aria-checked='true']) { background: #e7e2d6; }
.bc__opt:focus-visible, .bc__close:focus-visible { outline: 3px solid var(--focus); outline-offset: -3px; }
.bc__close { flex: none; width: 44px; border: 0; background: #fff; color: var(--ink); display: grid; place-items: center; cursor: pointer; }
.bc__close svg { width: 20px; height: 20px; }
@media (prefers-reduced-motion: reduce) { .bc__btn { transition: none; } }
</style>
