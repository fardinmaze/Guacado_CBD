<script setup>
import Brand from '@/components/ui/Brand.vue'
import { links, nav, promoLinks, site } from '@/data/site'
import badge from '@/assets/logos/guacado-badge.webp'
import AppLink from '@/components/ui/AppLink.vue'

// chipotle.com footer layout: big links (left column), small links (middle column), Rewards
// invitation (right, centred), then a row with "Download our app" (under the big links) and
// "Connect with us" (under the small links), the copyright line and the grey legal bar.
// Rewards and app links are placeholders in promoLinks (src/data/site.js).
const big = ['Menu', 'Order', 'Catering', 'Locations', 'Jobs', 'Franchise Opportunities'].map((l) => nav.find((n) => n.label === l))
big.push({ label: 'Rewards', href: promoLinks.rewardsLearn })
const small = [
  { label: 'Contact us', href: `mailto:${site.email}` },
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
          <AppLink :to="item.to" :href="item.href">{{ item.label === 'Franchise Opportunities' ? 'Franchise' : item.label }}</AppLink>
        </li>
      </ul>

      <ul class="ftr__small">
        <li v-for="item in small" :key="item.label"><AppLink :to="item.to" :href="item.href">{{ item.label }}</AppLink></li>
      </ul>

      <aside class="ftr__promo">
        <img :src="badge" alt="" width="84" height="86" loading="lazy" />
        <span class="ftr__brand"><Brand /> Rewards</span>
        <span class="ftr__kicker">Join Rewards</span>
        <b>Get rewarded.</b>
        <span class="ftr__lead">The faster way to your next free <Brand /> favorite.</span>
        <a :href="promoLinks.rewardsJoin" class="ftr__join">Join now</a>
        <a :href="promoLinks.rewardsLearn" class="ftr__learn">Learn more</a>
      </aside>
    </div>

    <div class="ftr__mid">
      <div>
        <h3>Download our app</h3>
        <div class="stores">
          <a :href="promoLinks.appStore" class="store" aria-label="Download on the App Store">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1zM13.9 5c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.5-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.4z" /></svg>
            <span><small>Download on the</small>App Store</span>
          </a>
          <a :href="promoLinks.googlePlay" class="store" aria-label="Get it on Google Play">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#00d7fe" d="M3.6 2.3c-.3.3-.4.7-.4 1.3v16.8c0 .6.2 1 .4 1.3l9.5-9.7z" /><path fill="#ffce00" d="M16.3 15.2 13.1 12l3.2-3.2 3.8 2.2c1.1.6 1.1 1.6 0 2.2z" /><path fill="#ff3a44" d="M16.3 15.2 13.1 12l-9.5 9.7c.4.4.9.4 1.6.1z" /><path fill="#00f076" d="M16.3 8.8 5.2 2.2c-.7-.4-1.2-.3-1.6.1l9.5 9.7z" /></svg>
            <span><small>Get it on</small>Google Play</span>
          </a>
        </div>
      </div>
      <div>
        <h3>Connect with us</h3>
        <div class="social">
          <a :href="site.instagram" aria-label="Fresh Guacado on Instagram"><svg viewBox="0 0 24 24"><path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2zM17 5.9a1.1 1.1 0 1 0 0 2.3 1.1 1.1 0 0 0 0-2.3zM21.9 7.9c-.1-1.6-.4-3-1.6-4.2S17.7 2.2 16.1 2.1C14.5 2 9.5 2 7.9 2.1 6.3 2.2 4.9 2.5 3.7 3.7S2.2 6.3 2.1 7.9C2 9.5 2 14.5 2.1 16.1c.1 1.6.4 3 1.6 4.2s2.6 1.5 4.2 1.6c1.6.1 6.6.1 8.2 0 1.6-.1 3-.4 4.2-1.6s1.5-2.6 1.6-4.2c.1-1.6.1-6.6 0-8.2zm-2.1 9.9a3.3 3.3 0 0 1-1.9 1.9c-1.3.5-4.4.4-5.9.4s-4.6.1-5.9-.4a3.3 3.3 0 0 1-1.9-1.9c-.5-1.3-.4-4.4-.4-5.8s-.1-4.6.4-5.8a3.3 3.3 0 0 1 1.9-1.9C7.4 3.8 10.5 3.9 12 3.9s4.6-.1 5.9.4a3.3 3.3 0 0 1 1.9 1.9c.5 1.3.4 4.4.4 5.8s.1 4.6-.4 5.8z" /></svg></a>
          <a :href="site.facebook" aria-label="Fresh Guacado on Facebook"><svg viewBox="0 0 24 24"><path d="M14 8.5V6.8c0-.8.5-1 .9-1H17V2.1L14.1 2C10.9 2 10.2 4.4 10.2 6v2.5H8v3.8h2.2V22H14v-9.7h2.9l.4-3.8H14z" /></svg></a>
        </div>
      </div>
    </div>

    <div class="ftr__copy">© 2026 <Brand /> Mexican Grill · <a href="#top">Back to top ↑</a></div>
    <div class="ftr__legal">
      <a :href="site.accessibility">Accessibility Statement</a>
    </div>
  </footer>
</template>

<style scoped>
.ftr { background: var(--ground); color: var(--ink); padding-top: clamp(36px, 5vw, 64px); }
.ftr__top { display: grid; gap: 36px; padding: 0 clamp(20px, 4vw, 64px); }
@media (min-width: 900px) { .ftr__top { grid-template-columns: 1.1fr 1fr 1fr; align-items: start; } }
ul { list-style: none; margin: 0; padding: 0; }
.ftr__big { display: grid; gap: 14px; }
.ftr__big a { font: 900 clamp(24px, 2.4vw, 32px)/1 var(--f-display); font-stretch: 72%; text-transform: uppercase; text-decoration: none; }
.ftr__big a:hover, .ftr__small a:hover { color: var(--accent-text); }
.ftr__small { display: grid; gap: 14px; }
.ftr__small a { font-weight: 700; font-size: 14px; text-decoration: none; }
.ftr__promo { display: grid; justify-items: center; gap: 6px; text-align: center; }
.ftr__promo img { width: 84px; height: auto; }
.ftr__kicker { font: 800 15px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent-text); margin-top: 6px; }
.ftr__promo b { font: 900 clamp(34px, 3.4vw, 46px)/1 var(--f-display); font-stretch: 72%; text-transform: uppercase; }
.ftr__lead { font-size: 13px; color: var(--ink-muted); max-width: 30ch; }
.ftr__join { margin-top: 10px; background: var(--guac); color: #fff; padding: 13px 34px; border-radius: 3px; text-decoration: none; font: 900 17px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.05em; }
.ftr__join:hover { background: var(--guac-dark); }
.ftr__brand { font: 900 14px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.06em; color: var(--guac); }
.ftr__learn { font: 800 12px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent-text); margin-top: 8px; }
.ftr__mid { display: grid; gap: 28px; padding: 40px clamp(20px, 4vw, 64px) 0; }
@media (min-width: 900px) { .ftr__mid { grid-template-columns: 1.1fr 1fr 1fr; } .ftr__mid > :nth-child(2) { grid-column: 2; } }
h3 { margin: 0 0 12px; font: 900 15px/1 var(--f-display); font-stretch: 80%; text-transform: uppercase; letter-spacing: 0.04em; }
.copy { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; background: transparent; border: 0; padding: 0; color: var(--ink); font: 600 14px var(--f-body); cursor: pointer; overflow-wrap: anywhere; text-align: left; }
.copy:hover { color: var(--accent-text); }
.copy svg { width: 15px; height: 15px; flex: none; }
.stores { display: flex; flex-wrap: wrap; gap: 10px; }
.store { display: inline-flex; align-items: center; gap: 9px; min-width: 150px; height: 48px; padding: 0 16px 0 12px; background: #000; color: #fff; border-radius: 9px; text-decoration: none; }
.store:hover { background: var(--ink); }
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
</style>
