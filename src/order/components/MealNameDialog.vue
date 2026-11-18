<script setup>
import { nextTick, ref, watch } from 'vue'

// "Who's this meal for?" — asked after ADD TO BAG (builder and family meals). A name is required;
// it is written on the bag. Emits `confirm(name)` or `cancel`.
const props = defineProps({
  open: { type: Boolean, default: false },
  initial: { type: String, default: '' },
  editing: { type: Boolean, default: false },
  title: { type: String, default: "Who's this meal for?" },
})
const emit = defineEmits(['confirm', 'cancel'])
const name = ref('')
const err = ref('')
const input = ref(null)

watch(
  () => props.open,
  async (on) => {
    if (!on) return
    name.value = props.initial
    err.value = ''
    await nextTick()
    input.value?.focus()
  },
  { immediate: true },
)
function submit() {
  if (!name.value.trim()) {
    err.value = 'Type a name so we can label the bag.'
    input.value?.focus()
    return
  }
  emit('confirm', name.value.trim())
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="nm" @click.self="emit('cancel')" @keydown.esc="emit('cancel')">
      <form class="nm__box" role="dialog" aria-modal="true" aria-labelledby="nm-t" novalidate @submit.prevent="submit">
        <h2 id="nm-t" class="nm__t">{{ title }}</h2>
        <p class="nm__d">We'll write the name on the bag so everyone gets the right meal.</p>
        <label class="nm__f">
          <span class="sr-only">Meal name</span>
          <input ref="input" v-model="name" type="text" maxlength="30" autocomplete="given-name" placeholder="e.g. Sara" :aria-invalid="!!err" aria-describedby="nm-e" />
        </label>
        <p id="nm-e" class="nm__e" role="alert">{{ err }}</p>
        <div class="nm__act">
          <button type="button" class="nm__cancel" @click="emit('cancel')">Cancel</button>
          <button type="submit" class="nm__ok">{{ editing ? 'Update meal' : 'Add to bag' }}</button>
        </div>
      </form>
    </div>
  </Teleport>
</template>

<style scoped>
.nm { position: fixed; inset: 0; z-index: 90; display: grid; place-items: center; padding: 16px; background: rgba(0, 0, 0, 0.55); }
.nm__box { width: min(100%, 440px); padding: 28px 24px 22px; background: #fff; border-radius: 6px; box-shadow: 0 24px 60px -20px rgba(0, 0, 0, 0.5); }
.nm__t { font: 900 30px/1 var(--f-display); font-stretch: 74%; text-transform: uppercase; }
.nm__d { margin: 10px 0 18px; font-size: 14px; color: var(--ink-muted); }
.nm__f input { width: 100%; min-height: 52px; padding: 0 14px; border: 1.5px solid #c8bfb0; border-radius: 4px; font: 600 17px var(--f-body); color: var(--ink); }
.nm__f input:focus-visible { outline: 3px solid var(--focus); outline-offset: 1px; }
.nm__f input[aria-invalid='true'] { border-color: var(--chili); }
.nm__e { min-height: 20px; margin: 6px 0 4px; font-size: 13px; font-weight: 700; color: var(--chili); }
.nm__act { display: flex; justify-content: flex-end; gap: 10px; }
.nm__cancel, .nm__ok { min-height: 48px; padding: 0 20px; border-radius: 3px; font: 900 16px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.04em; cursor: pointer; }
.nm__cancel { border: 1.5px solid #c8bfb0; background: #fff; color: var(--ink); }
.nm__ok { border: 0; background: var(--ink); color: #fff; }
.nm__ok:hover { background: var(--guac); }
.nm__cancel:focus-visible, .nm__ok:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
</style>
