import { beforeAll, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import App from '@/App.vue'
import BuildYourOwn from '@/components/sections/BuildYourOwn.vue'
import { createAppRouter } from '@/router'
import { ORDER_URL } from '@/data/site'

beforeAll(() => {
  // jsdom has no matchMedia: report reduced motion so GSAP tweens are skipped.
  window.matchMedia = (q) => ({
    matches: q.includes('reduce'),
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })
  window.scrollTo = () => {}
})

async function mountAt(path) {
  const router = createAppRouter(createMemoryHistory())
  router.push(path)
  await router.isReady()
  const wrapper = mount(App, { global: { plugins: [router] }, attachTo: document.body })
  await flushPromises()
  return { wrapper, router }
}

const orderLinks = (wrapper) => wrapper.findAll(`a[href="${ORDER_URL}"]`)

describe('App smoke test', () => {
  it('home runs the sales funnel in order', async () => {
    const { wrapper } = await mountAt('/')
    const ids = [...wrapper.element.querySelectorAll('section[id]')].map((s) => s.id)
    expect(ids).toEqual(['menu', 'join'])
    expect(wrapper.find('h1').text()).toContain('Big Mexican Flavors')
    expect(wrapper.findAll('.cat .cat__name').map((n) => n.text())).toEqual([
      'Burrito', 'Burrito Bowl', 'Birria Tacos', 'Taco Salad Bowl', 'Quesadilla', 'Loaded Plates',
      'Salad Bowl', 'Crunchwrap', 'Family Kit', 'Kids Meal', 'Sides', 'Tostada Special', 'Desserts', 'Drinks',
    ])
    // Featured: Chipotle-style carousel of tall cards with cal | price and an order button
    expect(wrapper.find('#feat-title').text()).toBe('Featured')
    expect(wrapper.findAll('.feat .fc')).toHaveLength(7)
    const birria = wrapper.findAll('.feat .fc').find((c) => c.find('.fc__name').text() === 'Birria Tacos')
    expect(birria.find('img').attributes('src')).toBe('/media/favorites/birria-tacos.webp')
    expect(birria.find('.fc__meta').text()).toMatch(/430–1150 Cal\s*From \$11\.95/)
    // Sides & dips lives on the Menu page only
    expect(wrapper.find('.sides').exists()).toBe(false)
    // Hero clip and the three story cards (guac, queso, birria)
    expect(wrapper.findAll('video')).toHaveLength(4)
    expect(wrapper.findAll('.trio .fcard')).toHaveLength(3)
    expect(wrapper.findAll('.trio .fcard')[1].classes()).toContain('is-hi') // highlighted card in the middle
    expect(wrapper.find('.fcard.is-hi').text()).toContain('Birria')
    // "Fresh" in the guac headline uses the brand accent; the queso card says "Say creamy queso"
    const titles = wrapper.findAll('.trio .fcard h2')
    expect(titles.map((t) => t.text())).toEqual(['Make room for Fresh Guac', 'Birria tacos', 'Creamy Queso'])
    expect(titles[0].find('.brand__fresh').text()).toBe('Fresh')
    // every Featured card links to the builder as "Build Your Own"
    wrapper.findAll('.feat .fc').forEach((c) => expect(c.find('.fc__own').text()).toBe('Build Your Own'))
    // Crowd pleasers: Group order (was Family kits) next to Catering
    expect(wrapper.find('#group h3').text()).toBe('Group order')
    expect(wrapper.find('#group img').attributes('src')).toBe('/media/catering/group-order.webp')
    expect(wrapper.find('.strip__t').text()).toBe('Join Guacado Rewards. Unlock Fresh Guacado.')
    expect(wrapper.find('#catering').exists()).toBe(true)
    wrapper.unmount()
  })

  it('puts an order button in the order strip, header, hero, mobile bar and footer', async () => {
    const { wrapper } = await mountAt('/')
    expect(wrapper.find('.strip__btn').attributes('href')).toBe(ORDER_URL)
    expect(wrapper.findAll('.ftr__big a').some((a) => a.text() === 'Order' && a.attributes('href') === ORDER_URL)).toBe(true)
    // External order links plus links into the in-site ordering flow (/order)
    const inSite = wrapper.findAll('a[href^="/order"]').length
    expect(orderLinks(wrapper).length + inSite).toBeGreaterThan(10)
    // Order pickup (header, hero, phone bar) opens the location picker first
    for (const sel of ['.act--order', '.hero__order', '.bar__cta']) {
      expect(wrapper.find(sel).element.tagName).toBe('BUTTON')
    }
    wrapper.unmount()
  })

  it('location picker: Pickup from opens it; searching by city or ZIP lists restaurants; choosing starts the order', async () => {
    const { wrapper, router } = await mountAt('/')
    expect(wrapper.find('.act--find').text()).toContain('Choose a location')
    await wrapper.find('.act--order').trigger('click')
    await flushPromises()
    const box = () => document.querySelector('.lp__box')
    expect(box().querySelector('.lp__tab[aria-selected=true]').textContent).toContain('Pickup')
    expect(box().querySelector('iframe').getAttribute('src')).toContain('maps.google.com')
    const input = box().querySelector('input')
    input.value = 'bronx'
    input.dispatchEvent(new Event('input'))
    await flushPromises()
    expect([...box().querySelectorAll('.lp__addr span')].every((s) => s.textContent.includes('Bronx'))).toBe(true)
    input.value = '11234'
    input.dispatchEvent(new Event('input'))
    await flushPromises()
    expect(box().querySelector('.lp__addr b').textContent).toBe('5119-A Avenue U') // nearest ZIP first
    box().querySelector('.lp__go').click()
    await flushPromises()
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/order/brooklyn-5119-a-avenue-u'))
    expect(document.querySelector('.lp__box')).toBeNull()
    wrapper.unmount()
  })

  it('order ticket updates live: default $12.95, steak + guac = $15.90', async () => {
    // The builder is a component (not on a marketing page right now); mount it on its own.
    const router = createAppRouter(createMemoryHistory())
    await router.push('/')
    const wrapper = mount(BuildYourOwn, { global: { plugins: [router] }, attachTo: document.body })
    await flushPromises()
    expect(wrapper.find('.ticket__total strong').text()).toBe('$12.95')
    const click = async (label) => {
      await wrapper.findAll('button').find((b) => b.text().startsWith(label)).trigger('click')
    }
    await click('Grilled Steak')
    await click('Add fresh guac')
    expect(wrapper.find('.ticket__total strong').text()).toBe('$15.90')
    expect(wrapper.find('.ticket').text()).toContain('Guac')
    await click('Start a new bowl')
    expect(wrapper.find('.ticket__total strong').text()).toBe('$12.95')
    wrapper.unmount()
  })

  it('navbar: Our Values replaces Order; the values page and the catering card link stay in-site', async () => {
    const { wrapper } = await mountAt('/')
    const nav = wrapper.findAll('.nav a').map((a) => a.text())
    expect(nav).toContain('Our Values')
    expect(nav).not.toContain('Order')
    const cater = wrapper.findAll('#catering a').find((a) => a.text() === 'See catering packages')
    expect(cater.attributes('href')).toBe('/catering')
    wrapper.unmount()
    const v = await mountAt('/values')
    expect(v.wrapper.find('h1').text()).toMatch(/We believe that\s*good food\s*brings people\s*together/i)
    expect(v.wrapper.findAll('.v-facts li').length).toBe(4)
    expect(v.wrapper.find('.v-facts li b').text()).toBe('6') // homemade sauces, from the menu data
    v.wrapper.unmount()
  })

  it('group order: feeding a crew? numbers appear only after choosing people and hunger', async () => {
    const { wrapper } = await mountAt('/')
    const crew = wrapper.find('.crew')
    expect(crew.find('.crew__list').exists()).toBe(false)
    expect(crew.find('output').text()).toBe('08')
    await crew.findAll('.crew__step button')[1].trigger('click')
    expect(crew.find('output').text()).toBe('09')
    await crew.findAll('.crew__seg button')[1].trigger('click') // Hungry
    const items = crew.findAll('.crew__list li').map((l) => l.text())
    expect(items).toEqual(['5 bowls & burritos', '10 tacos', '3 chips & dips', '9 drinks'])
    wrapper.unmount()
  })

  it('home has no location list, and prices only on the Featured cards (finder lives on /locations)', async () => {
    const { wrapper } = await mountAt('/')
    expect(wrapper.findAll('[data-loc]')).toHaveLength(0)
    expect(wrapper.find('.feat').text()).toMatch(/\$\d/)
    ;['.cats', '.trio', '.crowd'].forEach((sel) => expect(wrapper.find(sel).text()).not.toMatch(/\$\d/))
    wrapper.unmount()
  })

  it('shows 23 locations, filters by state and shows the empty state', async () => {
    const { wrapper } = await mountAt('/locations')
    expect(wrapper.findAll('[data-loc]')).toHaveLength(23)
    await wrapper.findAll('button').find((b) => b.text().startsWith('Michigan')).trigger('click')
    expect(wrapper.findAll('[data-loc]')).toHaveLength(1)
    await wrapper.find('input[type=search]').setValue('zzz')
    expect(wrapper.find('.empty').exists()).toBe(true)
    wrapper.unmount()
  })

  it('menu page is the Chipotle-style grid: 14 tiles into the order flow, no tile prices, no food advisory', async () => {
    const { wrapper } = await mountAt('/menu')
    expect(wrapper.find('h1').text()).toContain('Something delicious')
    const tiles = wrapper.findAll('.cat')
    expect(tiles).toHaveLength(14)
    tiles.forEach((t) => expect(t.attributes('href')).toMatch(/^\/order\?go=/))
    expect(wrapper.find('.cats').text()).not.toMatch(/\$\d/)
    expect(wrapper.find('.sides').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Consuming raw or undercooked meats')
    wrapper.unmount()
  })

  it('sets the document title per route', async () => {
    const { wrapper, router } = await mountAt('/catering')
    expect(document.title).toBe('Fresh Guacado Catering · Mexican Food for Every Gathering')
    await router.push('/')
    expect(document.title).toBe('Fresh Guacado Mexican Grill · Bowls, Tacos & Mexican Favorites')
    wrapper.unmount()
  })
})
