<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { findItem } from '@/order/lib/catalog'
import { cents, validate } from '@/order/lib/pricing'
import { useOrder } from '@/order/useOrder'
import { useBagSheet } from '@/order/useBagSheet'
import { useToast } from '@/composables/useToast'
import { occasions } from '@/data/site'
import BuildCard from '@/order/components/BuildCard.vue'
import MealNameDialog from '@/order/components/MealNameDialog.vue'

// Catering order, following catering.chipotle.com:
// 1. EVENT DETAILS — pickup restaurant, date, time (at least 24 hours ahead), headcount, event type.
// 2. Build — for packages with choices (Single / Double / Triple, Burritos by the Box, Chips & Dips):
//    the same photo cards as the builder. Fixed "popular builds" skip this step.
// 3. ADD TO BAG -> "Who's this order for?" -> the bag drawer. Priced per person (qty = people).
// The whole catering menu and its prices are SAMPLES until the owner publishes theirs.
const props = defineProps({
  store: { type: String, required: true },
  slug: { type: String, required: true },
})
const route = useRoute()
const router = useRouter()
const order = useOrder()
const toast = useToast()
const bag = useBagSheet()

const item = computed(() => {
  const i = findItem(props.slug)
  return i?.category === 'catering' ? i : null
})
watch(item, (i) => !i && router.replace('/catering'), { immediate: true })

const editLine = computed(() => order.state.lines.find((l) => l.id === route.query.edit) ?? null)
watch(
  () => [props.slug, route.query.edit],
  () => {
    if (!item.value) return
    const d = order.openDraft(item.value.slug, editLine.value)
    const people = Number(route.query.people)
    if (!d.editId && people) order.setQty(people)
  },
  { immediate: true },
)
const draft = computed(() => (item.value && order.state.draft?.itemSlug === item.value.slug ? order.state.draft : null))
const store = computed(() => order.store.value)

// --- Step 1: event details -------------------------------------------------------------------------
const NOTICE_MS = 24 * 60 * 60 * 1000
const pad = (n) => String(n).padStart(2, '0')
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const minDate = isoDate(new Date(Date.now() + NOTICE_MS))
const TIMES = Array.from({ length: 21 }, (_, k) => {
  const mins = 11 * 60 + k * 30 // 11:00 AM to 9:00 PM
  const h = Math.floor(mins / 60)
  const value = `${pad(h)}:${pad(mins % 60)}`
  const label = `${h % 12 || 12}:${pad(mins % 60)} ${h < 12 ? 'AM' : 'PM'}`
  return { value, label }
})
const peopleOptions = computed(() => {
  if (!item.value?.perPerson) return Array.from({ length: 10 }, (_, k) => k + 1)
  const out = []
  for (let n = item.value.minPeople ?? 10; n <= 200; n += n < 10 ? 1 : 5) out.push(n)
  return out
})
const form = reactive({ date: '', time: '', type: '' })
const formErr = ref('')
const editingDetails = ref(false)
watch(
  draft,
  (d) => {
    if (!d) return
    form.date = d.event?.date ?? ''
    form.time = d.event?.time ?? ''
    form.type = d.event?.type ?? ''
  },
  { immediate: true },
)
const step = computed(() => (!draft.value?.event || editingDetails.value ? 'details' : 'build'))
const hasChoices = computed(() => !!item.value?.groups.length)

function saveDetails() {
  if (!form.date || !form.time) {
    formErr.value = 'Choose a pickup date and time.'
    return
  }
  const when = new Date(`${form.date}T${form.time}`)
  if (when.getTime() - Date.now() < NOTICE_MS) {
    formErr.value = 'Catering needs at least 24 hours’ notice. Pick a later date or time.'
    return
  }
  formErr.value = ''
  order.setEvent({ date: form.date, time: form.time, type: form.type })
  editingDetails.value = false
  window.scrollTo({ top: 0, behavior: 'instant' })
  if (!hasChoices.value) startAdd()
}
const whenText = computed(() => {
  const e = draft.value?.event
  if (!e) return ''
  const d = new Date(`${e.date}T${e.time}`)
  return `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
})

// --- Step 2: build ----------------------------------------------------------------------------------
const sel = computed(() => draft.value?.selections ?? {})
const picksOf = (key) => sel.value[key] ?? []
const isPicked = (key, name) => picksOf(key).some((p) => p.name === name)
const atCap = (g) => g.maxSelect > 1 && picksOf(g.key).length >= g.maxSelect
const WORD = { 1: 'one', 2: 'two', 3: 'three' }
const titleOf = (g) => `${g.name} | ${g.minSelect === g.maxSelect ? 'Choose' : 'Up to'} ${WORD[g.maxSelect] ?? g.maxSelect}`
const errors = computed(() => (item.value ? validate(item.value, sel.value) : []))
const showErrors = ref(false)
const errorFor = (key) => errors.value.find((e) => e.group === key)?.message ?? ''
const total = computed(() => order.draftUnit.value * (draft.value?.qty ?? 1))
const qtyText = computed(() => (item.value?.perPerson ? `${draft.value?.qty} people` : `${draft.value?.qty} tray${draft.value?.qty > 1 ? 's' : ''}`))

// --- Step 3: add -----------------------------------------------------------------------------------
const naming = ref(false)
function startAdd() {
  if (errors.value.length) {
    showErrors.value = true
    const first = item.value.groups.find((g) => errorFor(g.key))
    if (first) document.getElementById(`sec-${first.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }
  naming.value = true
}
async function confirmName(name) {
  const wasEdit = !!draft.value?.editId
  order.setLabel(name)
  order.commitDraft()
  naming.value = false
  toast.show(wasEdit ? 'Catering order updated' : 'Added to your bag')
  await router.push(`/order/${props.store}`)
  bag.show()
}
</script>

<template>
  <div v-if="item && draft" class="co">
    <RouterLink to="/catering" class="back"><span aria-hidden="true">‹</span> Back to catering</RouterLink>

    <!-- Step 1: event details -->
    <section v-if="step === 'details'" class="ed" aria-labelledby="ed-t">
      <h1 id="ed-t" class="ed__t">Event details</h1>
      <p class="ed__d">We'll need some info before you can build your order.</p>
      <p class="ed__pkg"><strong>{{ item.name }}</strong> · {{ cents(item.basePriceCents) }}{{ item.perPerson ? ' / person' : ' / tray' }}</p>
      <div class="ed__tabs" role="tablist" aria-label="How you'll get it">
        <span class="ed__tab on" role="tab" aria-selected="true">Pickup</span>
      </div>
      <form class="ed__form" novalidate @submit.prevent="saveDetails">
        <div class="fld">
          <span class="fld__l">Pickup restaurant</span>
          <div class="fld__store">
            <span>{{ store ? `${store.address}, ${store.city}, ${store.state}` : 'Choose a restaurant' }}</span>
            <RouterLink :to="{ path: '/order', query: { change: 1, go: `catering:${item.slug}` } }">Change</RouterLink>
          </div>
        </div>
        <label class="fld">
          <span class="fld__l">Pickup date</span>
          <input v-model="form.date" type="date" :min="minDate" required />
        </label>
        <label class="fld">
          <span class="fld__l">Pickup time</span>
          <select v-model="form.time" required>
            <option value="" disabled>Select your pickup time</option>
            <option v-for="t in TIMES" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </label>
        <label class="fld">
          <span class="fld__l">{{ item.perPerson ? `Number of people (minimum ${item.minPeople})` : 'Number of trays' }}</span>
          <select :value="draft.qty" @change="order.setQty(Number($event.target.value))">
            <option v-for="n in peopleOptions" :key="n" :value="n">{{ n }}{{ item.perPerson ? ' people' : '' }}</option>
          </select>
        </label>
        <label class="fld">
          <span class="fld__l">Event type <small>(optional)</small></span>
          <select v-model="form.type">
            <option value="">Event type (optional)</option>
            <option v-for="o in occasions" :key="o" :value="o">{{ o }}</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <p class="ed__err" role="alert">{{ formErr }}</p>
        <button type="submit" class="ed__go">{{ hasChoices ? 'Save & build your order' : 'Save & add to bag' }}</button>
        <p class="ed__note">Please order at least 24 hours ahead so we can make everything fresh for your event.</p>
      </form>
    </section>

    <!-- Step 2: build -->
    <template v-else>
      <header class="hero">
        <div class="hero__img"><img :src="item.image" :alt="item.name" width="900" height="600" /></div>
        <div class="hero__copy">
          <p class="hero__pre">Build your</p>
          <h1 class="hero__t">{{ item.slug.startsWith('catering-') ? item.tier : item.name }}</h1>
          <p v-if="item.description" class="hero__d">{{ item.description }}</p>
          <p class="hero__meta"><span>{{ cents(item.basePriceCents) }}{{ item.perPerson ? ' / person' : ' / tray' }}</span><span>{{ qtyText }}</span></p>
        </div>
      </header>
      <div class="evt">
        <span><strong>Pickup</strong> {{ store?.address }}, {{ store?.city }} · {{ whenText }}<template v-if="draft.event?.type"> · {{ draft.event.type }}</template></span>
        <button type="button" @click="editingDetails = true">Edit details</button>
      </div>

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
            :name="o.name"
            :image="o.image"
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
            <span class="mbar__name">{{ item.name }} · {{ qtyText }} · {{ cents(total) }}</span>
          </div>
          <button type="button" class="mbar__add" @click="startAdd">{{ draft.editId ? 'Update' : 'Add to bag' }}</button>
        </div>
      </div>
    </template>

    <MealNameDialog
      :open="naming"
      title="Who's this order for?"
      :initial="draft.label"
      :editing="!!draft.editId"
      @confirm="confirmName"
      @cancel="naming = false"
    />
  </div>
</template>

<style scoped>
.co { max-width: 840px; margin: 0 auto; }
.back { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; color: var(--ink); text-decoration: none; font: 900 16px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.04em; }
.back span { font-size: 24px; }

/* Event details (catering.chipotle.com "EVENT DETAILS") */
.ed { max-width: 500px; margin: 8px auto 0; text-align: center; }
.ed__t { font: 900 clamp(30px, 4vw, 38px)/1 var(--f-display); font-stretch: 74%; text-transform: uppercase; }
.ed__d { margin-top: 8px; font-size: 15px; color: var(--ink-muted); }
.ed__pkg { margin-top: 10px; font-size: 14px; }
.ed__tabs { display: flex; justify-content: center; gap: 24px; margin: 22px 0 8px; }
.ed__tab { padding: 8px 4px; font: 900 16px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 3px solid var(--guac); }
.ed__form { display: grid; gap: 18px; margin-top: 18px; text-align: left; }
.fld { display: grid; gap: 6px; }
.fld__l { font-size: 12px; font-weight: 700; color: var(--ink-muted); }
.fld__l small { font-weight: 500; }
.fld input, .fld select { width: 100%; min-height: 48px; padding: 0 2px; border: 0; border-bottom: 1.5px solid #c8bfb0; background: transparent; color: var(--ink); font: 600 16px var(--f-body); }
.fld input:focus-visible, .fld select:focus-visible { outline: none; border-bottom-color: var(--guac); box-shadow: 0 2px 0 var(--guac); }
.fld__store { display: flex; justify-content: space-between; align-items: center; gap: 12px; min-height: 48px; border-bottom: 1.5px solid #c8bfb0; font-weight: 600; }
.fld__store a { color: var(--accent-text); font-weight: 800; font-size: 14px; }
.ed__err { min-height: 20px; margin: -6px 0 0; font-size: 14px; font-weight: 700; color: var(--chili); text-align: center; }
.ed__go { justify-self: center; min-height: 50px; padding: 0 32px; border: 0; border-radius: 3px; background: var(--ink); color: #fff; font: 900 17px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.04em; cursor: pointer; }
.ed__go:hover { background: var(--guac); }
.ed__go:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.ed__note { font-size: 12px; color: var(--ink-muted); text-align: center; }

/* Build step */
.hero { display: grid; gap: 16px 40px; align-items: center; padding: 16px 0 24px; }
@media (min-width: 700px) { .hero { grid-template-columns: minmax(0, 360px) 1fr; } }
.hero__img { aspect-ratio: 3 / 2; background: var(--surface); }
.hero__img img { display: block; width: 100%; height: 100%; object-fit: contain; }
.hero__pre { font: 500 18px/1 var(--f-display); font-stretch: 85%; text-transform: uppercase; color: var(--ink-muted); }
.hero__t { margin: 6px 0 14px; font: 900 clamp(40px, 6.5vw, 60px)/0.92 var(--f-display); font-stretch: 72%; text-transform: uppercase; }
.hero__d { max-width: 46ch; font-size: 15px; line-height: 1.55; }
.hero__meta { display: flex; flex-wrap: wrap; margin-top: 12px; font-size: 15px; font-weight: 700; }
.hero__meta span + span::before { content: ''; display: inline-block; width: 1px; height: 14px; margin: 0 10px; vertical-align: -2px; background: var(--ink-muted); }
.evt { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px 16px; padding: 14px 16px; background: var(--surface); font-size: 14px; border-top: 1px solid #d6d1c6; border-bottom: 1px solid #d6d1c6; }
.evt button { min-height: 40px; padding: 0; border: 0; background: none; color: var(--accent-text); font: 900 14px/1 var(--f-display); font-stretch: 85%; text-transform: uppercase; letter-spacing: 0.05em; text-decoration: underline; text-underline-offset: 4px; cursor: pointer; }
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
