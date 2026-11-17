import { beforeAll, describe, expect, it } from 'vitest'
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
    expect(wrapper.findAll('.cat')).toHaveLength(9)
    expect(wrapper.find('.feat').text()).toContain('Birria Tacos')
    // Bowl clips: hero loop and the two story cards
    expect(wrapper.findAll('video')).toHaveLength(3)
    expect(wrapper.find('#kits').exists()).toBe(true)
    expect(wrapper.find('#catering').exists()).toBe(true)
    wrapper.unmount()
  })

  it('puts an order button in the order strip, header, hero, mobile bar and footer', async () => {
    const { wrapper } = await mountAt('/')
    expect(wrapper.find('.strip__btn').attributes('href')).toBe(ORDER_URL)
    expect(wrapper.find('.act--order').attributes('href')).toBe(ORDER_URL)
    expect(wrapper.find('.bar__cta').attributes('href')).toBe(ORDER_URL)
    expect(wrapper.find('.ftr__order').attributes('href')).toBe(ORDER_URL)
    expect(wrapper.find('.hero a.btn').attributes('href')).toBe(ORDER_URL)
    expect(orderLinks(wrapper).length).toBeGreaterThan(10)
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

  it('home has no location list or prices (finder lives on /locations)', async () => {
    const { wrapper } = await mountAt('/')
    expect(wrapper.findAll('[data-loc]')).toHaveLength(0)
    expect(wrapper.text()).not.toMatch(/\$\d/)
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

  it('menu page is the Chipotle-style grid: 9 tiles into the order flow, no prices, food advisory', async () => {
    const { wrapper } = await mountAt('/menu')
    expect(wrapper.find('h1').text()).toContain('Something delicious')
    const tiles = wrapper.findAll('.cat')
    expect(tiles).toHaveLength(9)
    tiles.forEach((t) => expect(t.attributes('href')).toMatch(/^\/order\?go=/))
    expect(wrapper.text()).not.toMatch(/\$\d/)
    expect(wrapper.text()).toContain('Consuming raw or undercooked meats')
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
