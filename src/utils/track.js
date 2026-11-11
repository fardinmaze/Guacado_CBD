import { ORDER_URL, links, site } from '@/data/site'

// Vendor-neutral click tracking. Pushes events to window.dataLayer, so Google Tag Manager
// (or any tag that reads the dataLayer) can be switched on later without touching the site.
// Nothing is sent anywhere until a tag manager / analytics script is added to index.html.
const push = (event, extra = {}) => {
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, page_path: location.pathname, ...extra })
}

export function eventFor(anchor) {
  const href = anchor.getAttribute('href') || ''
  if (href.startsWith(ORDER_URL)) return 'order_click'
  if (href.startsWith('mailto:')) return 'email_click'
  if (href === links.jobs) return 'jobs_click'
  if (href === links.franchise) return 'franchise_click'
  if (href.startsWith(links.cateringPackages)) return 'catering_packages_click'
  if (href === site.facebook || href === site.instagram) return 'social_click'
  if (href.includes('google.com/maps')) return 'directions_click'
  return ''
}

export function initTracking() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href]')
    if (!a) return
    const event = eventFor(a)
    if (event) push(event, { button_text: a.textContent.trim().replace(/\s+/g, ' ').slice(0, 60) })
  })
}

export const trackEnquiry = () => push('catering_enquiry_submit')
