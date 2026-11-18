<script setup>
import Brand from '@/components/ui/Brand.vue'
import { computed } from 'vue'
import { stateNames, site } from '@/data/site'
import { useLocationFilter } from '@/composables/useLocationFilter'
import SectionHead from '@/components/ui/SectionHead.vue'
import OptionChip from '@/components/ui/OptionChip.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import LocationCard from '@/components/ui/LocationCard.vue'

// Search-first location finder. `limit` shows a short list (home page) until the guest searches.
const props = defineProps({
  limit: { type: Number, default: 0 },
  headingTag: { type: String, default: 'h2' },
  eyebrow: { type: String, default: 'Your next Fresh Guacado stop' },
  title: { type: String, default: 'Find your flavor nearby.' },
  intro: { type: String, default: '' }, // replaces the default lead
  instruction: { type: String, default: '' }, // line under the heading
})

const { state, query, filtered, stats, chips } = useLocationFilter()

const searching = computed(() => query.value.trim() !== '' || state.value !== 'All')
const visible = computed(() =>
  props.limit && !searching.value ? filtered.value.filter((l) => !l.soon).slice(0, props.limit) : filtered.value,
)
</script>

<template>
  <section id="locations" class="band band--alt">
    <div class="wrap">
      <SectionHead
        :eyebrow="eyebrow"
        :title="title"
        :tag="headingTag"
        :lead="intro || `${stats.open} open and ${stats.soon} coming soon across ${stats.states} states. ${site.hoursProse}.`"
      />

      <p v-if="instruction" class="instr">{{ instruction }}</p>
      <div class="tools">
        <!-- Search + delivery side by side. Delivery runs through the online ordering partner. -->
        <div class="searchrow">
          <label class="search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <span class="sr-only">Search Fresh Guacado locations by city, street or ZIP code</span>
            <input v-model="query" type="search" placeholder="Enter a city, street or ZIP code" autocomplete="postal-code" />
          </label>
          <a :href="site.orderUrl" class="deliver" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
            Get delivery<span class="sr-only"> (opens our online ordering in a new tab)</span>
          </a>
        </div>
        <div class="filters" role="group" aria-label="Filter by state">
          <OptionChip v-for="c in chips" :key="c.code" :pressed="state === c.code" @click="state = c.code">
            {{ c.code === 'All' ? 'All' : stateNames[c.code] }} <small>{{ c.count }}</small>
          </OptionChip>
        </div>
      </div>

      <div v-if="visible.length" class="locs">
        <LocationCard v-for="l in visible" :key="l.address + l.zip" :location="l" />
      </div>
      <p v-else class="empty" role="status">No <Brand /> locations match "{{ query }}". Check the spelling or try a nearby ZIP.</p>

      <div v-if="limit && !searching" class="more">
        <BaseButton to="/locations" variant="outline">See all {{ filtered.length }} locations</BaseButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
.instr { color: var(--ink-muted); margin: -12px 0 18px; }
.tools { display: grid; gap: 14px; margin-bottom: 24px; }
.searchrow { display: flex; flex-wrap: wrap; align-items: stretch; gap: 10px; max-width: 760px; }
.search { position: relative; display: block; flex: 1 1 320px; max-width: 560px; }
.deliver { flex: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 56px; padding: 0 26px; border-radius: var(--r-pill); background: var(--guac); color: #fff; text-decoration: none; font: 900 16px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
.deliver svg { width: 20px; height: 20px; }
.deliver:hover { background: var(--guac-dark); }
.deliver:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
@media (max-width: 480px) { .deliver { flex: 1 1 100%; } }
.search svg { position: absolute; left: 18px; top: 50%; width: 20px; height: 20px; transform: translateY(-50%); color: var(--ink-muted); }
.search input {
  width: 100%;
  min-height: 56px;
  padding: 0 20px 0 50px;
  border-radius: var(--r-pill);
  border: 2px solid var(--ink);
  background: var(--surface-raised);
  color: var(--ink);
  font: 600 16px var(--f-body);
}
.search input::placeholder { color: var(--ink-muted); font-weight: 500; }
.filters { display: flex; flex-wrap: wrap; gap: 8px; }
.locs { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)); }
.empty { color: var(--ink-muted); padding: 24px 0; }
.more { margin-top: 24px; }
</style>
