import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import App from '@/App.vue'
import { createAppRouter } from '@/router'
import { findItem, findStore, stores, categories, categoryFrom } from '@/order/lib/catalog'
import {
  calories, cents, defaultSelection, fromCents, isStale, setLevel, summaryParts, taxCents, togglePick, totals, unitCents, validate,
} from '@/order/lib/pricing'
import { minutesUntilClose, pickupSlots, storeStatus } from '@/order/lib/hours'
import { __resetOrder, useOrder } from '@/order/useOrder'

const byo = findItem('build-your-own')
// The builder starts empty apart from the base; most cases want the classic chicken bowl.
const sel = (over = {}) => ({ ...defaultSelection(byo), protein: [{ name: 'Grill Chicken', level: 'regular' }], ...over })
const pick = (name, level = 'regular') => [{ name, level }]

describe('seed data', () => {
  it('has 23 stores, 4 coming soon, Michigan on Detroit time', () => {
    expect(stores).toHaveLength(23)
    expect(stores.filter((s) => s.status === 'COMING_SOON')).toHaveLength(4)
    expect(findStore('hamtramck-12197-conant-rd').timezone).toBe('America/Detroit')
  })
  it('every category has "From $X" and every option name is unique inside its group', () => {
    categories.forEach((c) => expect(categoryFrom(c)).toBeGreaterThan(0))
    categories.flatMap((c) => c.items).flatMap((i) => i.groups ?? []).forEach((g) => {
      expect(new Set(g.options.map((o) => o.name)).size).toBe(g.options.length)
    })
  })
})

describe('pricing (03-TECH-SPEC §4 required cases)', () => {
  it('a new meal starts with only the base; chicken bowl = $12.95', () => {
    const fresh = defaultSelection(byo)
    expect(fresh.base).toEqual(pick('Bowl'))
    expect(['protein', 'rice', 'beans', 'toppings', 'sauce'].every((k) => fresh[k].length === 0)).toBe(true)
    expect(validate(byo, fresh)[0].group).toBe('protein')
    expect(unitCents(byo, sel())).toBe(1295)
  })
  it('half and half: two proteins cost the dearer one, two rices are free', () => {
    const half = sel({ protein: [{ name: 'Tofu', level: 'regular' }, { name: 'Grilled Steak', level: 'regular' }], rice: [{ name: 'Mexican Rice', level: 'regular' }, { name: 'Cilantro Lime White Rice', level: 'regular' }] })
    expect(validate(byo, half)).toEqual([])
    expect(unitCents(byo, half)).toBe(1395)
    expect(summaryParts(byo, half).slice(1, 3)).toEqual(['½ Tofu, ½ Grilled Steak', '½ Mexican Rice, ½ Cilantro Lime White Rice'])
    const protein = byo.groups.find((g) => g.key === 'protein')
    expect(togglePick(protein, half.protein, 'Grill Chicken')).toHaveLength(2) // a third is ignored
  })
  it('Honey Chipotle + guac = $15.90', () => {
    expect(unitCents(byo, sel({ protein: pick('Honey Chipotle'), addons: pick('Add Fresh Guac') }))).toBe(1590)
  })
  it('Extra protein on steak = $16.90, charged once whether by level or add-on', () => {
    expect(unitCents(byo, sel({ protein: pick('Grilled Steak', 'extra') }))).toBe(1690)
    expect(unitCents(byo, sel({ protein: pick('Grilled Steak'), addons: pick('Extra Protein') }))).toBe(1690)
    expect(unitCents(byo, sel({ protein: pick('Grilled Steak', 'extra'), addons: pick('Extra Protein') }))).toBe(1690)
  })
  it('base, toppings, sauces and levels are free', () => {
    const s = sel({ base: pick('Nachos'), rice: pick('Cilantro Lime White Rice', 'extra'), toppings: [{ name: 'Medium Red Salsa', level: 'extra' }, { name: 'Romaine Lettuce', level: 'side' }], sauce: pick('Smoky Habanero Sauce', 'light') })
    expect(unitCents(byo, s)).toBe(1295)
  })
  it('Birria Pie = $30.95', () => {
    const birria = findItem('birria-tacos')
    expect(unitCents(birria, { meat: pick('Beef'), size: pick('Pie') })).toBe(3095)
  })
  it('2 dips at 8oz guacamole = $13.90', () => {
    const g = findItem('guacamole')
    expect(unitCents(g, { size: pick('8 oz') }) * 2).toBe(1390)
  })
  it('a fixed item with a base price: tostada $8.95', () => {
    expect(unitCents(findItem('tostada'), defaultSelection(findItem('tostada')))).toBe(895)
  })
  it('Fajita Kit needs exactly 2 proteins', () => {
    const kit = findItem('fajita-kit')
    expect(validate(kit, { kitProteins: pick('Tofu') })[0].message).toBe('Pick exactly 2.')
    expect(validate(kit, { kitProteins: [...pick('Tofu'), ...pick('Grill Chicken')] })).toEqual([])
    expect(unitCents(kit, { kitProteins: [...pick('Tofu'), ...pick('Grill Chicken')] })).toBe(5595)
  })
  it('tax at 0.08875 on 1295 = 115; unknown rate shows no tax', () => {
    expect(taxCents(1295, 0.08875)).toBe(115)
    expect(taxCents(1295, null)).toBeNull()
    expect(totals(1295, { rate: null, tipPct: 15 })).toMatchObject({ tax: null, taxPending: true, tip: 194, total: 1489 })
    expect(totals(1295, { rate: 0.08875 }).total).toBe(1410)
  })
  it('"From" prices', () => {
    expect(fromCents(byo)).toBe(1195)
    expect(fromCents(findItem('birria-tacos'))).toBe(1195)
    expect(fromCents(findItem('chips'))).toBe(295)
    expect(cents(1195)).toBe('$11.95')
  })
})

describe('selection rules', () => {
  const toppings = byo.groups.find((g) => g.key === 'toppings')
  const base = byo.groups.find((g) => g.key === 'base')
  it('single choice swaps and cannot be cleared', () => {
    expect(togglePick(base, pick('Bowl'), 'Burrito')).toEqual(pick('Burrito'))
    expect(togglePick(base, pick('Bowl'), 'Bowl')).toEqual(pick('Bowl'))
  })
  it('multi choice toggles and stops at the cap', () => {
    let p = []
    toppings.options.forEach((o) => (p = togglePick(toppings, p, o.name)))
    expect(p).toHaveLength(toppings.maxSelect)
    expect(togglePick(toppings, p, 'Pico de Gallo')).toHaveLength(toppings.maxSelect - 1)
    const addons = byo.groups.find((g) => g.key === 'addons')
    expect(togglePick(addons, pick('Add Fresh Guac'), 'Add Queso Blanco')).toHaveLength(2)
  })
  it('levels only apply where the group allows them', () => {
    expect(validate(byo, sel({ base: [{ name: 'Bowl', level: 'extra' }] }))).toHaveLength(1)
    expect(validate(byo, sel({ rice: [{ name: 'Mexican Rice', level: 'side' }] }))).toEqual([])
    expect(setLevel(pick('Mexican Rice'), 'Mexican Rice', 'light')).toEqual(pick('Mexican Rice', 'light'))
  })
  it('summarises a meal for the bag', () => {
    const s = sel({ rice: pick('Mexican Rice', 'light'), beans: pick('Pinto Beans'), toppings: pick('Pico de Gallo'), sauce: pick('Chipotle Sauce') })
    expect(summaryParts(byo, s)).toEqual(['Bowl', 'Grill Chicken', 'Mexican Rice (light)', 'Pinto Beans', 'Pico de Gallo', 'Chipotle Sauce'])
  })
  it('every builder card has a photo and sample calories; the meal adds them up by level', () => {
    byo.groups.flatMap((g) => g.options).filter((o) => o.name !== 'Extra Protein').forEach((o) => {
      expect(o.image).toMatch(/^\/media\/build\/.+\.webp$/)
      expect(o.cal).toBeTypeOf('number')
    })
    // Bowl 0 + chicken 180 + Mexican rice 210 + black beans 130 + pico 25 + chipotle sauce 100
    const meal = sel({ rice: pick('Mexican Rice'), beans: pick('Black Beans'), toppings: pick('Pico de Gallo'), sauce: pick('Chipotle Sauce') })
    expect(calories(byo, meal)).toBe(645)
    expect(calories(byo, { ...meal, rice: pick('Mexican Rice', 'light') })).toBe(540)
    // half and half: 90 chicken + 75 steak; doubling the protein doubles both halves
    const half = { ...meal, protein: [{ name: 'Grill Chicken', level: 'regular' }, { name: 'Grilled Steak', level: 'regular' }] }
    expect(calories(byo, half)).toBe(645 - 180 + 90 + 75)
    expect(calories(byo, { ...half, addons: pick('Extra Protein') })).toBe(645 - 180 + 180 + 150)
  })
  it('spots a meal saved under an older menu', () => {
    expect(isStale(byo, sel())).toBe(false)
    expect(isStale(byo, { ...sel(), toppings: pick('Rice') })).toBe(true)
  })
})

describe('hours and pickup slots (store time zone)', () => {
  const avenueU = findStore('brooklyn-5119-a-avenue-u') // 10:30 → 03:00
  it('open in the afternoon, closes 3am', () => {
    const t = new Date('2026-11-02T20:00:00Z') // 3:00pm EST
    expect(minutesUntilClose(avenueU, t)).toBe(720)
    expect(storeStatus(avenueU, t)).toEqual({ state: 'open', label: 'Open · closes 3am' })
  })
  it('still open after midnight (the window belongs to the day it opened)', () => {
    const t = new Date('2026-11-03T06:30:00Z') // 1:30am EST
    expect(minutesUntilClose(avenueU, t)).toBe(90)
    const slots = pickupSlots(avenueU, t)
    expect(slots.map((s) => s.label)).toEqual(['1:45 AM', '2:00 AM', '2:15 AM', '2:30 AM', '2:45 AM'])
  })
  it('closed in the morning: slots start 15 min after opening', () => {
    const t = new Date('2026-11-03T11:00:00Z') // 6:00am EST
    expect(storeStatus(avenueU, t)).toEqual({ state: 'closed', label: 'Closed · opens 10:30am' })
    expect(pickupSlots(avenueU, t)[0].label).toBe('10:45 AM')
  })
  it('first slot is now + prep, rounded up to the quarter hour', () => {
    const s = pickupSlots(avenueU, new Date('2026-11-02T20:00:00Z'))
    expect(s[0].label).toBe('3:15 PM')
    expect(s.at(-1).label).toBe('2:45 AM')
  })
  it('clocks going back: 1:30am EDT really has 150 minutes left, not 90', () => {
    expect(minutesUntilClose(avenueU, new Date('2026-11-01T05:30:00Z'))).toBe(150)
  })
  it('Michigan uses Detroit time; coming-soon stores have no slots', () => {
    expect(pickupSlots(findStore('hamtramck-12197-conant-rd'), new Date('2026-11-02T20:00:00Z')).length).toBeGreaterThan(0)
    const soon = findStore('new-york-1884-3rd-ave')
    expect(pickupSlots(soon)).toEqual([])
    expect(storeStatus(soon).state).toBe('soon')
  })
})

describe('order store', () => {
  beforeEach(() => {
    localStorage.clear()
    __resetOrder()
  })
  it('only lets guests choose an open store', () => {
    const o = useOrder()
    expect(o.chooseStore('new-york-1884-3rd-ave')).toBe(false)
    expect(o.chooseStore('brooklyn-5119-a-avenue-u')).toBe(true)
    expect(o.store.value.city).toBe('Brooklyn')
  })
  it('builds, edits, duplicates and removes lines; the subtotal follows', () => {
    const o = useOrder()
    o.openDraft('build-your-own')
    o.pick('protein', 'Grilled Steak')
    o.level('protein', 'Grilled Steak', 'extra')
    o.setLabel('Sara')
    o.setQty(2)
    expect(o.draftUnit.value).toBe(1690)
    const line = o.commitDraft()
    expect(o.subtotal.value).toBe(3380)
    o.duplicateLine(line.id)
    expect(o.count.value).toBe(4)
    o.setLineQty(line.id, 0)
    expect(o.state.lines).toHaveLength(1)
    o.quickAdd('chips')
    o.quickAdd('chips')
    expect(o.state.lines.find((l) => l.itemSlug === 'chips').qty).toBe(2)
    expect(o.subtotal.value).toBe(3380 + 590)
  })
  it('a draft survives a "refresh" (persisted to localStorage)', async () => {
    const o = useOrder()
    o.openDraft('build-your-own')
    o.pick('base', 'Burrito')
    await flushPromises()
    expect(JSON.parse(localStorage.getItem('guacado.order.v1')).draft.selections.base[0].name).toBe('Burrito')
  })
})

describe('ordering flow in the app', () => {
  beforeAll(() => {
    window.matchMedia = (q) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })
    window.scrollTo = () => {}
    Element.prototype.scrollIntoView = () => {}
  })
  beforeEach(() => {
    localStorage.clear()
    __resetOrder()
  })
  async function mountAt(path) {
    const router = createAppRouter(createMemoryHistory())
    router.push(path)
    await router.isReady()
    const wrapper = mount(App, { global: { plugins: [router] }, attachTo: document.body })
    await flushPromises()
    return { wrapper, router }
  }
  const click = async (w, text, sel = 'button') => {
    await w.findAll(sel).find((b) => b.text().includes(text)).trigger('click')
    await flushPromises()
  }

  it('hides the marketing header and footer on /order', async () => {
    const { wrapper } = await mountAt('/order')
    expect(wrapper.find('footer').exists()).toBe(false)
    expect(wrapper.text()).toContain('Where are we')
    wrapper.unmount()
  })

  it('location picker: search, coming soon is not selectable, choosing opens the menu', async () => {
    const { wrapper, router } = await mountAt('/order')
    expect(wrapper.findAll('.row')).toHaveLength(23)
    await wrapper.find('input[type=search]').setValue('1884')
    const row = wrapper.find('.row')
    expect(row.attributes('disabled')).toBeDefined()
    await wrapper.find('input[type=search]').setValue('Avenue U')
    await wrapper.find('.row').trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/order/brooklyn-5119-a-avenue-u'))
    await flushPromises()
    expect(wrapper.text()).toContain('Build your own!')
    expect(wrapper.text()).not.toMatch(/\$\d/) // no prices until checkout
    wrapper.unmount()
  })

  it('a coming-soon store link is bounced back to the picker', async () => {
    const { wrapper, router } = await mountAt('/order/new-york-1884-3rd-ave')
    expect(router.currentRoute.value.path).toBe('/order')
    wrapper.unmount()
  })

  it('remembers the store: /order skips the picker', async () => {
    useOrder().chooseStore('brooklyn-2006-cropsey-avenue')
    const { wrapper, router } = await mountAt('/order')
    expect(router.currentRoute.value.path).toBe('/order/brooklyn-2006-cropsey-avenue')
    wrapper.unmount()
  })

  const B = '/order/brooklyn-5119-a-avenue-u/build'

  it('builder: choose a base first, then it is not shown again ("Change" brings it back)', async () => {
    const { wrapper, router } = await mountAt(B)
    expect(wrapper.find('.hero__t').text()).toBe('Choose your meal')
    expect(wrapper.find('.tags').exists()).toBe(false)
    await click(wrapper, 'Burrito', '.bc__btn')
    expect(router.currentRoute.value.query.base).toBe('burrito')
    expect(wrapper.find('.hero__t').text()).toBe('Burrito')
    expect(wrapper.find('.hero__pre').text()).toBe('Build your')
    expect(wrapper.find('#h-base').exists()).toBe(false) // the base list is gone
    await click(wrapper, 'Change', '.hero__change')
    expect(wrapper.find('#h-base').exists()).toBe(true)
    await click(wrapper, 'Quesadilla', '.bc__btn')
    expect(wrapper.find('.hero__t').text()).toBe('Quesadilla')
    wrapper.unmount()
  })

  it('a menu tile can open the builder with its base (go=build:burrito)', async () => {
    useOrder().chooseStore('brooklyn-5119-a-avenue-u')
    const { wrapper, router } = await mountAt('/order?go=build:burrito')
    expect(router.currentRoute.value.path).toBe(B)
    expect(wrapper.find('.hero__t').text()).toBe('Burrito')
    wrapper.unmount()
  })

  it('builder cards: NAME, note, price and cal; steak + guac = $15.90 in the bag', async () => {
    const { wrapper, router } = await mountAt(`${B}?base=bowl`)
    expect(wrapper.find('.mbar__name').text()).toBe('Select a protein or veggie to get started')
    const steak = wrapper.findAll('.bc').find((c) => c.text().includes('Grilled Steak'))
    expect(steak.find('.bc__meta').text()).toMatch(/\$13\.95\s*150 cal/)
    expect(wrapper.findAll('.bc').find((c) => c.text().includes('Veggie Fajita')).find('.bc__note').text()).toBe('Includes guacamole')
    expect(wrapper.findAll('.sec')).toHaveLength(6)
    await click(wrapper, 'Grilled Steak', '.bc__btn')
    await click(wrapper, 'Add Fresh Guac', '.bc__btn')
    expect(wrapper.find('.mbar__name').text()).toBe('Grilled Steak Bowl')
    expect(wrapper.find('.mbar__price strong').text()).toBe('$15.90')
    await click(wrapper, 'Add to bag', '.mbar__add')
    expect(router.currentRoute.value.path).toBe('/order/brooklyn-5119-a-avenue-u')
    expect(useOrder().subtotal.value).toBe(1590)
    wrapper.unmount()
  })

  it('two proteins are half and half (1/2 badges); a third waits until one is untapped', async () => {
    const { wrapper } = await mountAt(`${B}?base=bowl`)
    await click(wrapper, 'Grill Chicken', '.bc__btn')
    await click(wrapper, 'Grilled Steak', '.bc__btn')
    expect(wrapper.findAll('#sec-protein .bc__badge.half')).toHaveLength(2)
    expect(wrapper.find('.mbar__name').text()).toBe('Grill Chicken & Grilled Steak Bowl')
    expect(wrapper.findAll('.bc').find((c) => c.text().includes('Tofu')).find('.bc__btn').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Double portion of Grill Chicken and Grilled Steak')
    await click(wrapper, 'Double your protein', '.bc__btn')
    expect(wrapper.find('.mbar__price strong').text()).toBe('$16.90')
    await click(wrapper, 'Mexican Rice', '.bc__btn')
    await click(wrapper, 'Cilantro Lime White Rice', '.bc__btn')
    expect(wrapper.findAll('#sec-rice .bc__badge.half')).toHaveLength(2)
    await click(wrapper, 'No Rice', '.bc__btn')
    expect(useOrder().state.draft.selections.rice).toEqual([])
    wrapper.unmount()
  })

  it('tags scroll to portions, mark the done ones, and the URL keeps the place', async () => {
    const { wrapper, router } = await mountAt(`${B}?base=bowl`)
    expect(wrapper.findAll('.tag').map((t) => t.text().replace(' (done)', ''))).toEqual(['Protein', 'Rice', 'Beans', 'Toppings', 'Sauce', 'Finish'])
    const scrolls = []
    window.scrollTo = (o) => scrolls.push(o)
    await click(wrapper, 'Toppings', '.tag')
    expect(scrolls.some((o) => o && o.behavior === 'smooth')).toBe(true)
    expect(router.currentRoute.value.query.step).toBe('toppings')
    expect(wrapper.find('.tag[data-key=toppings]').attributes('aria-current')).toBe('true')
    expect(wrapper.find('.tag[data-key=beans]').classes()).not.toContain('done')
    await click(wrapper, 'Pinto Beans', '.bc__btn')
    expect(wrapper.find('.tag[data-key=beans]').classes()).toContain('done')
    window.scrollTo = () => {}
    wrapper.unmount()
  })

  it('refresh mid-build keeps the base, the choices and the portion', async () => {
    const first = await mountAt(`${B}?base=burrito&step=protein`)
    await click(first.wrapper, 'Grilled Shrimp', '.bc__btn')
    first.wrapper.unmount()
    const again = await mountAt(`${B}?base=burrito&step=protein`)
    expect(again.wrapper.find('.hero__t').text()).toBe('Burrito')
    expect(again.wrapper.find('.tag.on').text()).toContain('Protein')
    expect(again.wrapper.findAll('[aria-pressed=true]').some((b) => b.text().includes('Grilled Shrimp'))).toBe(true)
    again.wrapper.unmount()
  })

  it('the options panel offers Light / Normal / Extra / Side (Normal / Double for protein)', async () => {
    const { wrapper } = await mountAt(`${B}?base=bowl`)
    const card = () => wrapper.findAll('.bc').find((c) => c.text().includes('Pico de Gallo'))
    await card().find('.bc__more').trigger('click')
    const radios = card().findAll('[role=radio]')
    expect(radios.map((r) => r.text())).toEqual(['Light', 'Normal', 'Extra', 'Side'])
    await radios[0].trigger('click') // picks Pico at Light
    await flushPromises()
    expect(useOrder().state.draft.selections.toppings).toEqual([{ name: 'Pico de Gallo', level: 'light' }])
    expect(card().find('[role=radiogroup]').exists()).toBe(false) // panel closes
    const chicken = () => wrapper.findAll('.bc').find((c) => c.text().includes('Grill Chicken'))
    await chicken().find('.bc__more').trigger('click')
    expect(chicken().findAll('[role=radio]').map((r) => r.text())).toEqual(['Normal', 'Double +$2.95'])
    wrapper.unmount()
  })

  it('kit item: add is blocked until exactly 2 proteins are chosen', async () => {
    const { wrapper } = await mountAt('/order/brooklyn-5119-a-avenue-u/item/taco-kit')
    // default selection already picks nothing for kit proteins
    await click(wrapper, 'ADD TO BAG')
    expect(useOrder().state.lines).toHaveLength(0)
    expect(wrapper.text()).toContain('Pick exactly 2.')
    await click(wrapper, 'Tofu')
    await click(wrapper, 'Grilled Steak')
    await click(wrapper, 'ADD TO BAG')
    expect(useOrder().subtotal.value).toBe(4995)
    wrapper.unmount()
  })

  it('quick add, bag sheet and checkout (payment stays off)', async () => {
    const { wrapper, router } = await mountAt('/order/brooklyn-5119-a-avenue-u')
    await wrapper.find('[aria-label="Add Chips to bag"]').trigger('click')
    expect(wrapper.find('.bar__total').exists()).toBe(false)
    expect(wrapper.find('.bar__cap').text()).toContain('1 in your bag')
    await click(wrapper, 'VIEW BAG')
    const sheet = document.querySelector('[role=dialog]')
    expect(sheet.textContent).toContain('Chips')
    expect(sheet.textContent).not.toMatch(/\$\d/)
    expect(sheet.textContent).toContain('Chips')
    sheet.querySelector('[aria-label="Close bag"]').click()
    await flushPromises()
    expect(document.querySelector('[role=dialog]')).toBeNull()
    wrapper.unmount()
    const co = await mountAt('/order/checkout')
    expect(co.wrapper.text()).toContain('Online payment isn')
    expect(co.wrapper.text()).toContain('Confirmed at your restaurant')
    expect(co.wrapper.find('.bar button').attributes('disabled')).toBeDefined()
    expect(router).toBeTruthy()
    co.wrapper.unmount()
  })
})
