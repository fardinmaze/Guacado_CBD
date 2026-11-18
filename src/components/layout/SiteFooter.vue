<script setup>
import Brand from '@/components/ui/Brand.vue'
import { links, nav, promoLinks, site } from '@/data/site'
import badge from '@/assets/logos/guacado-badge.webp'
import AppLink from '@/components/ui/AppLink.vue'

// chipotle.com footer, top to bottom: link list (big uppercase links, then small links) beside a
// Rewards invite, "Download our app" badges and "Connect with us"; then the copyright line and
// the legal row. Links are Guacado's real pages; Rewards and app links are placeholders in
// promoLinks (src/data/site.js) until the program and app exist.
const byLabel = (l) => nav.find((n) => n.label === l)
const big = [
  { label: 'Order', href: site.orderUrl, cls: 'ftr__order' },
  { label: 'Menu', to: '/menu' },
  { label: 'Catering', to: '/catering' },
  { label: 'Locations', to: '/locations' },
  { label: 'Rewards', href: promoLinks.rewardsLearn },
  { label: 'Careers', href: byLabel('Jobs').href },
]
const small = [
  { label: 'Contact us', href: `mailto:${site.email}` },
  { label: 'Franchise opportunities', href: links.franchise },
  { label: 'Full menu on guacadomexican.com', href: links.fullMenu },
  { label: 'Catering packages', href: links.cateringPackages },
  { label: 'All locations', to: '/locations' },
  { label: 'Accessibility', href: site.accessibility },
]
</script>

<template>
  <footer class="ftr">
    <div class="ftr__top">
      <ul class="ftr__big">
        <li v-for="item in big" :key="item.label">
          <AppLink :to="item.to" :href="item.href" :class="item.cls">{{ item.label }}</AppLink>
        </li>
      </ul>

      <ul class="ftr__small">
        <li v-for="item in small" :key="item.label"><AppLink :to="item.to" :href="item.href">{{ item.label }}</AppLink></li>
      </ul>

      <div class="ftr__side">
        <!-- Rewards invitation -->
        <section class="rw" aria-labelledby="rw-title">
          <div class="rw__logo">
            <img :src="badge" alt="" width="56" height="58" loading="lazy" />
            <span><Brand /><b>Rewards</b></span>
          </div>
          <p class="rw__kicker">Join Rewards</p>
          <h3 id="rw-title" class="rw__title">Get rewarded.</h3>
          <p class="rw__lead">The faster way to your next free Fresh Guacado favorite.</p>
          <div class="rw__actions">
            <a :href="promoLinks.rewardsJoin" class="rw__join">Join now</a>
            <a :href="promoLinks.rewardsLearn" class="rw__learn">Learn more</a>
          </div>
        </section>

        <!-- App download -->
        <section class="app" aria-labelledby="app-title">
          <h3 id="app-title">Download our app</h3>
          <div class="app__badges">
            <a :href="promoLinks.appStore" class="store" aria-label="Download on the App Store">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1zM13.9 5c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.5-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.4z" /></svg>
              <span><small>Download on the</small>App Store</span>
            </a>
            <a :href="promoLinks.googlePlay" class="store" aria-label="Get it on Google Play">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#00d7fe" d="M3.6 2.3c-.3.3-.4.7-.4 1.3v16.8c0 .6.2 1 .4 1.3l9.5-9.7z" />
                <path fill="#ffce00" d="M16.3 15.2 13.1 12l3.2-3.2 3.8 2.2c1.1.6 1.1 1.6 0 2.2z" />
                <path fill="#ff3a44" d="M16.3 15.2 13.1 12l-9.5 9.7c.4.4.9.4 1.6.1z" />
                <path fill="#00f076" d="M16.3 8.8 5.2 2.2c-.7-.4-1.2-.3-1.6.1l9.5 9.7z" />
              </svg>
              <span><small>Get it on</small>Google Play</span>
            </a>
          </div>
        </section>

        <!-- Social -->
        <section class="connect" aria-labelledby="connect-title">
          <h3 id="connect-title">Connect with us</h3>
          <div class="social">
            <a :href="site.instagram" aria-label="Fresh Guacado on Instagram"><svg viewBox="0 0 24 24"><path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2zM17 5.9a1.1 1.1 0 1 0 0 2.3 1.1 1.1 0 0 0 0-2.3zM21.9 7.9c-.1-1.6-.4-3-1.6-4.2S17.7 2.2 16.1 2.1C14.5 2 9.5 2 7.9 2.1 6.3 2.2 4.9 2.5 3.7 3.7S2.2 6.3 2.1 7.9C2 9.5 2 14.5 2.1 16.1c.1 1.6.4 3 1.6 4.2s2.6 1.5 4.2 1.6c1.6.1 6.6.1 8.2 0 1.6-.1 3-.4 4.2-1.6s1.5-2.6 1.6-4.2c.1-1.6.1-6.6 0-8.2zm-2.1 9.9a3.3 3.3 0 0 1-1.9 1.9c-1.3.5-4.4.4-5.9.4s-4.6.1-5.9-.4a3.3 3.3 0 0 1-1.9-1.9c-.5-1.3-.4-4.4-.4-5.8s-.1-4.6.4-5.8a3.3 3.3 0 0 1 1.9-1.9C7.4 3.8 10.5 3.9 12 3.9s4.6-.1 5.9.4a3.3 3.3 0 0 1 1.9 1.9c.5 1.3.4 4.4.4 5.8s.1 4.6-.4 5.8z" /></svg></a>
            <a :href="site.facebook" aria-label="Fresh Guacado on Facebook"><svg viewBox="0 0 24 24"><path d="M14 8.5V6.8c0-.8.5-1 .9-1H17V2.1L14.1 2C10.9 2 10.2 4.4 10.2 6v2.5H8v3.8h2.2V22H14v-9.7h2.9l.4-3.8H14z" /></svg></a>
          </div>
        </section>
      </div>
    </div>

    <div class="ftr__copy">© 2026 <Brand /> Mexican Grill · <a href="#top">Back to top ↑</a></div>
    <div class="ftr__legal">
      <a :href="site.accessibility">Accessibility Statement</a>
      <span>Consuming raw or undercooked meats, poultry, seafood, shellfish or eggs may increase your risk of foodborne illness.</span>
    </div>
  </footer>
</template>

<style scoped>
.ftr { background: var(--ground); color: var(--ink); padding-top: clamp(36px, 5vw, 64px); border-top: 1px solid var(--line); }
.ftr__top { display: grid; gap: 36px; padding: 0 clamp(20px, 4vw, 64px); }
@media (min-width: 900px) { .ftr__top { grid-template-columns: 1fr 1fr 1.25fr; align-items: start; } }
ul { list-style: none; margin: 0; padding: 0; }
.ftr__big { display: grid; gap: 14px; }
.ftr__big a { font: 900 clamp(24px, 2.4vw, 32px)/1 var(--f-display); font-stretch: 72%; text-transform: uppercase; text-decoration: none; }
.ftr__big a:hover, .ftr__small a:hover { color: var(--accent-text); }
.ftr__big .ftr__order { color: var(--accent-text); }
.ftr__small { display: grid; gap: 14px; align-content: start; }
.ftr__small a { font-weight: 700; font-size: 14px; text-decoration: none; }

.ftr__side { display: grid; gap: 28px; }
h3 { margin: 0 0 12px; font: 900 15px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.04em; }

/* Rewards invitation: green card with the Guacado badge lock-up. */
.rw { background: var(--guac); color: var(--on-green); border-radius: 14px; padding: 24px clamp(20px, 2.4vw, 28px) 26px; }
.rw__logo { display: flex; align-items: center; gap: 10px; }
.rw__logo img { width: 52px; height: auto; background: #fff; border-radius: 50%; padding: 3px; }
.rw__logo span { display: grid; font: 900 15px/1.05 var(--f-display); font-stretch: 78%; text-transform: uppercase; letter-spacing: 0.04em; }
.rw__logo b { color: var(--lime); font-size: 22px; letter-spacing: 0.02em; }
.rw__kicker { margin: 18px 0 6px; font: 800 13px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.12em; color: var(--lime); }
.rw__title { margin: 0; font: 900 clamp(36px, 3.6vw, 48px)/0.95 var(--f-display); font-stretch: 72%; letter-spacing: 0; }
.rw__lead { margin: 10px 0 18px; font-size: 14px; line-height: 1.5; color: rgba(255, 255, 255, 0.88); max-width: 34ch; }
.rw__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; }
.rw__join { background: var(--lime); color: var(--on-lime); padding: 13px 26px; border-radius: 3px; text-decoration: none; font: 900 16px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.06em; }
.rw__join:hover { background: #fff; color: var(--guac); }
.rw__learn { color: #fff; font: 800 13px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.1em; text-underline-offset: 4px; }
.rw__learn:hover { color: var(--lime); }

/* App store badges (drawn in SVG + text, store-badge style). */
.app__badges { display: flex; flex-wrap: wrap; gap: 10px; }
.store { display: inline-flex; align-items: center; gap: 9px; min-width: 150px; height: 48px; padding: 0 16px 0 12px; background: #000; color: #fff; border-radius: 9px; text-decoration: none; transition: transform 0.2s, background-color 0.2s; }
.store:hover { background: var(--ink); transform: translateY(-2px); }
.store svg { width: 24px; height: 24px; fill: currentColor; flex: none; }
.store span { display: grid; font: 600 18px/1.05 var(--f-body); letter-spacing: -0.01em; }
.store small { font-size: 10.5px; font-weight: 500; letter-spacing: 0.02em; }

.social { display: flex; gap: 10px; }
.social a { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: var(--ink); color: #fff; }
.social a:hover { background: var(--guac); }
.social svg { width: 17px; height: 17px; fill: currentColor; }

.ftr__copy { padding: 36px clamp(20px, 4vw, 64px) 28px; font-size: 12.5px; color: var(--ink-muted); }
.ftr__copy a { color: inherit; }
.ftr__legal { background: #f0efec; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 28px; padding: 22px clamp(16px, 4vw, 48px) calc(26px + env(safe-area-inset-bottom, 0px)); font-size: 11.5px; color: var(--ink-muted); text-align: center; }
.ftr__legal a { color: inherit; }
@media (prefers-reduced-motion: reduce) { .store { transition: none; } }
</style>
