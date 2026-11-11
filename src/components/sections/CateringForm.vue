<script setup>
import { computed, reactive, ref } from 'vue'
import locations from '@/data/locations.json'
import { site } from '@/data/site'
import { cityLine } from '@/utils/format'
import { trackEnquiry } from '@/utils/track'

// Catering enquiry. There is no backend, so submitting opens the guest's email app with every
// detail filled in (to the Guacado inbox). Swap `send()` for a POST when an endpoint exists.
const openLocations = locations.filter((l) => !l.soon)
const form = reactive({ name: '', email: '', phone: '', date: '', headcount: '', location: '', notes: '' })
const sent = ref(false)
const today = new Date().toISOString().slice(0, 10)

const body = computed(() =>
  [
    `Name: ${form.name}`,
    `Email: ${form.email}`,
    `Phone: ${form.phone}`,
    `Event date: ${form.date}`,
    `Guests: ${form.headcount}`,
    `Nearest location: ${form.location || 'Not sure yet'}`,
    '',
    form.notes,
  ].join('\n'),
)

function send() {
  const subject = encodeURIComponent(`Catering enquiry: ${form.headcount} guests on ${form.date}`)
  window.location.href = `mailto:${site.email}?subject=${subject}&body=${encodeURIComponent(body.value)}`
  sent.value = true
  trackEnquiry()
}
</script>

<template>
  <section id="enquiry" class="band enq" aria-labelledby="enq-title">
    <div class="wrap enq__in">
      <div class="enq__intro">
        <span class="eyebrow">Plan your event</span>
        <h2 id="enq-title" class="display">Tell us what you're planning.</h2>
        <p>Share the date, headcount and your nearest location. We'll use it to plan the spread around your guests.</p>
      </div>

      <form class="enq__form" @submit.prevent="send">
        <label>Your name<input v-model.trim="form.name" required autocomplete="name" /></label>
        <label>Phone<input v-model.trim="form.phone" required type="tel" autocomplete="tel" inputmode="tel" /></label>
        <label class="wide">Email<input v-model.trim="form.email" required type="email" autocomplete="email" /></label>
        <label>Event date<input v-model="form.date" required type="date" :min="today" /></label>
        <label>Number of guests<input v-model="form.headcount" required type="number" min="1" inputmode="numeric" /></label>
        <label class="wide">
          Nearest location
          <select v-model="form.location">
            <option value="">Not sure yet</option>
            <option v-for="l in openLocations" :key="l.address + l.zip" :value="`${l.address}, ${cityLine(l)}`">{{ l.address }}, {{ cityLine(l) }}</option>
          </select>
        </label>
        <label class="wide">Anything else we should know?<textarea v-model="form.notes" rows="3" placeholder="Dietary needs, kind of event, pickup time" /></label>
        <button class="btn-send" type="submit">Send enquiry</button>
        <p class="note" role="status">
          {{ sent ? 'Your email app should have opened with your details ready to send. If it did not, write to ' + site.email + '.' : 'This opens your email app with your details filled in.' }}
        </p>
      </form>
    </div>
  </section>
</template>

<style scoped>
.enq__in { display: grid; gap: 28px; max-width: 980px; }
@media (min-width: 860px) { .enq__in { grid-template-columns: 0.8fr 1.2fr; gap: 48px; align-items: start; } }
.enq__intro { display: grid; gap: 12px; }
h2 { font-size: clamp(32px, 4vw, 48px); }
.enq__intro p { color: var(--ink-muted); max-width: 40ch; }
.enq__form { display: grid; gap: 14px; grid-template-columns: 1fr 1fr; }
.wide, .btn-send, .note { grid-column: 1 / -1; }
@media (max-width: 520px) { .enq__form { grid-template-columns: 1fr; } }
label { display: grid; gap: 6px; font: 800 13px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.08em; }
input, select, textarea { font: 500 16px var(--f-body); letter-spacing: 0; text-transform: none; padding: 12px 14px; border: 1.5px solid var(--line); border-radius: 4px; background: #fff; color: var(--ink); min-height: 48px; width: 100%; }
textarea { resize: vertical; }
input:focus, select:focus, textarea:focus { border-color: var(--guac); outline: 2px solid var(--guac); outline-offset: 1px; }
.btn-send { background: var(--guac); color: #fff; border: 0; border-radius: 4px; min-height: 54px; font: 900 18px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.06em; cursor: pointer; }
.btn-send:hover { background: var(--guac-dark); }
.note { font-size: 13px; color: var(--ink-muted); }
</style>
