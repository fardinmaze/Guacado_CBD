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
        <label class="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <span class="sr-only">Search Fresh Guacado locations by city, street or ZIP code</span>
          <input v-model="query" type="search" placeholder="Enter a city, street or ZIP code" autocomplete="postal-code" />
        </label>
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
.search { position: relative; display: block; max-width: 560px; }
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
