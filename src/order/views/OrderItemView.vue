<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { calLabel, findItem } from '@/order/lib/catalog'
import { cents, validate } from '@/order/lib/pricing'
import { useOrder } from '@/order/useOrder'
import { useBagSheet } from '@/order/useBagSheet'
import { useToast } from '@/composables/useToast'
import BuildCard from '@/order/components/BuildCard.vue'
import MealNameDialog from '@/order/components/MealNameDialog.vue'

// Any menu item with choices that doesn't have its own flow (drinks like Jarritos and shakes, dips,
// tacos, birria, the tostada...). Same look as the builder / family kit pages: photo hero,
// "Group | Choose one" sections of photo cards, YOUR ORDER bar. Meals ask "Who's this meal for?";
// drinks, sides, dips and desserts go straight in the bag. Both end in the bag drawer.
const props = defineProps({ store: { type: String, required: true }, slug: { type: String, required: true } })
const route = useRoute()
const router = useRouter()
const order = useOrder()
const toast = useToast()
const bag = useBagSheet()

const item = computed(() => findItem(props.slug))
const editLine = computed(() => order.state.lines.find((l) => l.id === route.query.edit) ?? null)
watch(
  () => [props.slug, route.query.edit],
  () => item.value && order.openDraft(props.slug, editLine.value),
  { immediate: true },
)
const draft = computed(() => (order.state.draft?.itemSlug === props.slug ? order.state.draft : null))
const sel = computed(() => draft.value?.selections ?? {})
const picksOf = (key) => sel.value[key] ?? []
const isPicked = (key, name) => picksOf(key).some((p) => p.name === name)
const atCap = (g) => g.maxSelect > 1 && picksOf(g.key).length >= g.maxSelect
const WORD = { 1: 'one', 2: 'two', 3: 'three' }
const titleOf = (g) => {
  const n = WORD[g.maxSelect] ?? g.maxSelect
  const rule = g.maxSelect === 1 ? (g.minSelect ? 'Choose one' : 'Optional') : g.minSelect === g.maxSelect ? `Choose ${n}` : `Up to ${n}`
  const label = g.name.replace(/^Choose (your )?/i, '')
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} | ${rule}`
}
const priceOf = (g, o) => (g.setsPrice ? cents(o.priceCents) : o.priceCents ? `+${cents(o.priceCents)}` : '')
const errors = computed(() => (item.value ? validate(item.value, sel.value) : []))
const showErrors = ref(false)
const errorFor = (key) => errors.value.find((e) => e.group === key)?.message ?? ''
const total = computed(() => order.draftUnit.value * (draft.value?.qty ?? 1))
const choice = computed(() => (item.value?.groups ?? []).flatMap((g) => picksOf(g.key).map((p) => p.name)).join(', '))
const isMeal = computed(() => ['tacos', 'specials'].includes(item.value?.category))

const naming = ref(false)
function add() {
  if (errors.value.length) {
    showErrors.value = true
    const first = item.value.groups.find((g) => errorFor(g.key))
    if (first) document.getElementById(`sec-${first.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }
  if (isMeal.value) naming.value = true
  else finish()
}
async function finish(name) {
  const wasEdit = !!draft.value.editId
  if (name) order.setLabel(name)
  order.commitDraft()
  naming.value = false
  toast.show(wasEdit ? 'Updated' : `${item.value.name} added`)
  await router.push(`/order/${props.store}`)
  bag.show()
}
</script>

<template>
  <div v-if="item && draft" class="iv">
    <RouterLink to="/menu" class="back"><span aria-hidden="true">‹</span> Return to menu</RouterLink>

    <header class="hero" :class="{ 'no-img': !item.image }">
      <div v-if="item.image" class="hero__img"><img :src="item.image" :alt="item.name" width="360" height="360" /></div>
      <div class="hero__copy">
        <p class="hero__pre">Make it yours</p>
        <h1 class="hero__t">{{ item.name }}</h1>
        <p v-if="item.description" class="hero__d">{{ item.description }}</p>
        <p class="hero__meta"><span v-if="calLabel(item)">{{ calLabel(item) }}</span><span v-if="item.basePriceCents">{{ cents(item.basePriceCents) }}</span></p>
      </div>
    </header>

    <section v-if="item.includes" class="sec" aria-labelledby="h-inc">
      <h2 id="h-inc" class="sec__t">Included</h2>
      <p class="sec__sub">{{ item.includes.join(' · ') }}</p>
    </section>

    <section v-for="g in item.groups" :id="`sec-${g.key}`" :key="g.key" class="sec" :aria-labelledby="`h-${g.key}`">
      <h2 :id="`h-${g.key}`" class="sec__t">{{ titleOf(g) }}</h2>
      <p v-if="showErrors && errorFor(g.key)" class="sec__err" role="alert">{{ errorFor(g.key) }}</p>
      <ul class="grid">
        <BuildCard
          v-for="o in g.options"
          :key="o.name"
          :name="o.label ?? o.name"
          :image="o.image ?? ''"
          :tag="o.tag"
          :price="priceOf(g, o)"
          :picked="isPicked(g.key, o.name)"
          :disabled="atCap(g)"
          @pick="order.pick(g.key, o.name)"
        />
      </ul>
      <p v-if="atCap(g)" class="sec__hint">That's the limit. Tap one to swap it out.</p>
    </section>

    <div class="mbar">
      <div class="mbar__in">
        <div class="mbar__meal">
          <span class="mbar__k">Your order</span>
          <span class="mbar__name">{{ item.name }}<template v-if="choice"> · {{ choice }}</template> · {{ cents(total) }}</span>
        </div>
        <button type="button" class="mbar__add" @click="add">{{ draft.editId ? 'Update' : 'Add to bag' }}</button>
      </div>
    </div>

    <MealNameDialog :open="naming" :initial="draft.label" :editing="!!draft.editId" @confirm="finish" @cancel="naming = false" />
  </div>
</template>

<style scoped>
.iv { max-width: 840px; margin: 0 auto; }
.back { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; color: var(--ink); text-decoration: none; font: 900 16px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.04em; }
.back span { font-size: 24px; }
.hero { display: grid; gap: 16px 40px; align-items: center; padding: 16px 0 28px; border-bottom: 1px solid #d6d1c6; }
@media (min-width: 700px) { .hero:not(.no-img) { grid-template-columns: minmax(0, 300px) 1fr; } }
.hero__img { position: relative; aspect-ratio: 1; background: var(--surface); }
.hero__img img { position: absolute; inset: 8%; width: 84%; height: 84%; object-fit: contain; filter: drop-shadow(0 14px 18px rgba(20, 35, 27, 0.2)); }
.hero__pre { font: 500 18px/1 var(--f-display); font-stretch: 85%; text-transform: uppercase; color: var(--ink-muted); }
.hero__t { margin: 6px 0 14px; font: 900 clamp(40px, 6.5vw, 60px)/0.92 var(--f-display); font-stretch: 72%; text-transform: uppercase; }
.hero__d { max-width: 46ch; font-size: 15px; line-height: 1.55; }
.hero__meta { display: flex; flex-wrap: wrap; margin-top: 12px; font-size: 15px; font-weight: 700; }
.hero__meta span + span::before { content: ''; display: inline-block; width: 1px; height: 14px; margin: 0 10px; vertical-align: -2px; background: var(--ink-muted); }
.sec { padding: 32px 0 10px; }
.sec__t { margin-bottom: 16px; font: 900 clamp(26px, 4vw, 32px)/1 var(--f-display); font-stretch: 74%; text-transform: uppercase; }
.sec__sub { font-size: 15px; color: var(--ink-muted); }
.sec__err { margin: -6px 0 14px; font-weight: 700; color: var(--chili); }
.sec__hint { margin-top: 10px; font-size: 13px; color: var(--ink-muted); }
.grid { list-style: none; margin: 0; padding: 0; display: grid; gap: 24px; }
@media (min-width: 700px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 699px) { .grid { gap: 12px; } }
.mbar { position: fixed; inset: auto 0 0; z-index: 40; background: #f1f0ee; border-top: 1px solid #dedad2; padding-bottom: env(safe-area-inset-bottom, 0px); }
.mbar__in { display: flex; align-items: center; gap: 12px 24px; max-width: 1200px; margin: 0 auto; padding: 14px var(--gut-r) 14px var(--gut-l); }
.mbar__meal { display: grid; gap: 6px; min-width: 0; flex: 1; }
.mbar__k { font: 900 16px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.03em; }
.mbar__name { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mbar__add { flex: none; min-height: 50px; padding: 0 clamp(22px, 5vw, 72px); border: 0; border-radius: 3px; background: var(--ink); color: #fff; font: 900 18px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.04em; cursor: pointer; }
.mbar__add:hover { background: var(--guac); }
.mbar__add:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
@media (max-width: 520px) { .mbar__k { display: none; } .mbar__add { padding: 0 18px; font-size: 16px; } }
</style>
