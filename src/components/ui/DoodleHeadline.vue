<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { prefersReducedMotion } from '@/composables/useMotion'

// Hand-lettered headline that "writes itself" once when scrolled into view, in the spirit of
// chipotle.com/values (their headlines are frame-drawn GIFs; this is our own code version).
// Letters wipe open one by one like pen strokes, then each line's doodles draw in:
// underlines, a dotted trail, and rays that burst around a word.
//
// lines: [{ text, size: 'sm'|'md'|'lg'|'xl', tone?: 'guac', under?: 'wave'|'double'|'dots', burst?: true }]
const props = defineProps({
  tag: { type: String, default: 'h2' },
  lines: { type: Array, required: true },
  letterMs: { type: Number, default: 46 }, // gap between letters
  pause: { type: Number, default: 160 }, // pen lift between lines
})

const label = computed(() => props.lines.map((l) => l.text).join(' '))

// Small, repeatable wobble per letter so the type feels drawn by hand (no Math.random: stable
// between renders and in tests).
const wobble = (i) => {
  const r = Math.sin(i * 12.9898) * 43758.5453
  const f = r - Math.floor(r)
  return { rot: (f - 0.5) * 5, y: (Math.sin(i * 3.7) * 0.04).toFixed(3) }
}

// Build the timeline: every letter, underline and burst gets its own delay.
const plan = computed(() => {
  let t = 0
  let n = 0
  return props.lines.map((line) => {
    const start = t
    const chars = [...line.text].map((c) => {
      const w = wobble(n++)
      const ch = {
        c: c === ' ' ? ' ' : c,
        space: c === ' ',
        up: /[ILTH1!]/i.test(c) && n % 3 === 0, // some strokes go bottom→top
        style: { transitionDelay: `${t}ms`, '--rot': `${w.rot.toFixed(2)}deg`, '--dy': `${w.y}em` },
      }
      if (c !== ' ') t += props.letterMs
      return ch
    })
    const textEnd = t
    const under = line.under ? { kind: line.under, delay: line.under === 'double' ? start : textEnd } : null
    const burst = line.burst ? { delay: textEnd + 80 } : null
    t = textEnd + (line.under || line.burst ? 260 : 0) + props.pause
    return { ...line, chars, under, burst }
  })
})

// Emphasis marks: a small fan of strokes beside the word (the left fan is the same svg mirrored).
// viewBox 0 0 40 40, fan centred on the left edge middle.
const RAYS = [-50, -25, 0, 25, 50].map((deg, k) => {
  const a = (deg * Math.PI) / 180
  const len = k % 2 === 0 ? 26 : 18
  return {
    x1: 4 + Math.cos(a) * 6, y1: 20 + Math.sin(a) * 10,
    x2: 4 + Math.cos(a) * (6 + len), y2: 20 + Math.sin(a) * (10 + len),
    i: k,
  }
})

const root = ref(null)
const drawn = ref(false)
let io = null
onMounted(() => {
  if (prefersReducedMotion() || typeof IntersectionObserver !== 'function') {
    drawn.value = true
    return
  }
  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        drawn.value = true
        io.disconnect()
      }
    },
    { threshold: 0.35 },
  )
  io.observe(root.value)
})
onBeforeUnmount(() => io && io.disconnect())
</script>

<template>
  <component :is="tag" ref="root" class="doodle" :class="{ 'is-drawn': drawn }">
    <span class="sr-only">{{ label }}</span>
    <span class="doodle__art" aria-hidden="true">
      <span
        v-for="(line, li) in plan"
        :key="li"
        class="doodle__line"
        :class="[`d-${line.size || 'md'}`, line.tone && `d-tone-${line.tone}`, line.under && 'has-under']"
      >
        <span class="doodle__word">
          <span
            v-for="(ch, ci) in line.chars"
            :key="ci"
            class="ch"
            :class="{ 'ch--up': ch.up, 'ch--sp': ch.space }"
            :style="ch.style"
          >{{ ch.c }}</span>

          <!-- rays around the line -->
          <template v-if="line.burst">
            <svg v-for="(side, si) in ['r', 'l']" :key="side" :class="['burst', `burst--${side}`]" viewBox="0 0 40 40">
              <line
                v-for="r in RAYS"
                :key="r.i"
                :x1="r.x1" :y1="r.y1" :x2="r.x2" :y2="r.y2"
                pathLength="1"
                class="ink draw"
                :style="{ transitionDelay: `${line.burst.delay + (si * 5 + r.i) * 40}ms` }"
              />
            </svg>
          </template>
        </span>

        <!-- hand-drawn underline -->
        <svg
          v-if="line.under && line.under.kind !== 'dots'"
          class="under"
          viewBox="0 0 400 24"
          preserveAspectRatio="none"
        >
          <path
            class="ink draw" pathLength="1"
            :style="{ transitionDelay: `${line.under.delay}ms` }"
            d="M3 14 C70 4 130 22 200 12 S330 4 397 13"
          />
          <path
            v-if="line.under.kind === 'double'"
            class="ink ink--thin draw" pathLength="1"
            :style="{ transitionDelay: `${line.under.delay + 140}ms` }"
            d="M10 21 C80 12 140 26 210 18 S330 11 392 19"
          />
        </svg>
        <svg
          v-else-if="line.under"
          class="under under--dots"
          viewBox="0 0 400 12"
          preserveAspectRatio="none"
          :style="{ transitionDelay: `${line.under.delay}ms` }"
        >
          <path class="ink ink--dots" d="M150 6 Q280 1 397 6" />
        </svg>
      </span>
    </span>
  </component>
</template>

<style scoped>
.doodle { --ink: currentColor; display: grid; justify-items: center; text-align: center; margin: 0; font-family: var(--f-display); text-transform: uppercase; line-height: 0.86; }
.doodle__art { display: grid; justify-items: center; }
.doodle__line { position: relative; display: block; padding-bottom: 0.06em; }
.doodle__word { position: relative; display: inline-block; white-space: nowrap; }

/* sizes match the original lettered headline scale */
.d-sm { font: 800 clamp(22px, 3vw, 40px)/1 var(--f-display); font-stretch: 80%; letter-spacing: 0.04em; }
.d-md { font-weight: 900; font-size: clamp(40px, 6vw, 84px); font-stretch: 78%; }
.d-lg { font-weight: 900; font-size: clamp(52px, 8vw, 116px); font-stretch: 72%; }
.d-xl { font-weight: 900; font-size: clamp(68px, 11vw, 160px); font-stretch: 70%; }
.d-tone-guac { color: var(--guac); }
@media (max-width: 520px) { .doodle__word { white-space: normal; } }

/* ---------- letters: each wipes open like a pen stroke ---------- */
.ch {
  display: inline-block;
  transform: translateY(var(--dy, 0)) rotate(var(--rot, 0deg));
  clip-path: inset(-25% 100% -25% -25%);
  transition: clip-path 150ms steps(3, end);
}
.ch--up { clip-path: inset(100% -25% -25% -25%); }
.ch--sp { clip-path: none; }
.is-drawn .ch { clip-path: inset(-25% -25% -25% -25%); }

/* ---------- strokes ---------- */
.ink { fill: none; stroke: var(--ink); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.ink--thin { stroke-width: 2; }
/* gap of 2 so nothing peeks out before the stroke starts; hidden until its turn */
.draw { stroke-dasharray: 1 2; stroke-dashoffset: 1; opacity: 0; transition: stroke-dashoffset 420ms cubic-bezier(0.6, 0.05, 0.3, 1), opacity 0s; }
.is-drawn .draw { stroke-dashoffset: 0; opacity: 1; }
.has-under { margin-bottom: 0.16em; }
.d-sm.has-under { margin-bottom: 0.3em; }

.under { position: absolute; left: -2%; right: -2%; bottom: -0.32em; width: 104%; height: 0.36em; overflow: visible; color: inherit; }
.d-sm .under { bottom: -0.42em; height: 0.5em; }
.under--dots { bottom: -0.2em; height: 0.2em; clip-path: inset(0 100% 0 0); transition: clip-path 700ms linear; }
.is-drawn .under--dots { clip-path: inset(0 0 0 0); }
.ink--dots { stroke-width: 3; stroke-dasharray: 0.1 9; }

.burst { position: absolute; top: 50%; width: 0.62em; height: 0.62em; overflow: visible; pointer-events: none; }
.burst--r { left: 100%; transform: translate(0.04em, -50%); }
.burst--l { right: 100%; transform: translate(-0.04em, -50%) scaleX(-1); }
.burst .ink { stroke-width: 3.5; }
/* phones: the word fills the width, so the fans sit on its top corners pointing up and out */
@media (max-width: 600px) {
  .burst { top: 0; width: 0.42em; height: 0.42em; }
  .burst--r { left: auto; right: -0.12em; transform: translateY(-70%) rotate(-55deg); }
  .burst--l { right: auto; left: -0.12em; transform: translateY(-70%) scaleX(-1) rotate(-55deg); }
}
.burst .draw { transition-duration: 200ms; }

@media (prefers-reduced-motion: reduce) {
  .ch, .draw, .under--dots { transition: none !important; }
}
</style>
