import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import App from '@/App.vue'
import { createAppRouter } from '@/router'
import { findItem, findStore, stores, categories, categoryFrom } from '@/order/lib/catalog'
import {
  breakdown, calories, cents, defaultSelection, fromCents, isStale, setLevel, summaryParts, taxCents, togglePick, totals, unitCents, validate,
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
  it('Fajita Kit needs exactly 2 proteins plus a rice and a beans; defaults are chicken + steak', () => {
    const kit = findItem('fajita-kit')
    const sides = { kitRice: pick('Mexican Rice'), kitBeans: pick('Pinto Beans') }
    expect(validate(kit, { ...sides, kitProteins: pick('Tofu') })[0].message).toBe('Pick exactly 2.')
    expect(validate(kit, { ...sides, kitProteins: [...pick('Tofu'), ...pick('Grill Chicken')] })).toEqual([])
    expect(unitCents(kit, { ...sides, kitProteins: [...pick('Tofu'), ...pick('Grill Chicken')] })).toBe(5595)
    expect(defaultSelection(kit)).toEqual({ kitProteins: [...pick('Grill Chicken'), ...pick('Grilled Steak')], kitRice: pick('Mexican Rice'), kitBeans: pick('Black Beans') })
    expect(findItem('nacho-kit').groups.map((g) => g.key)).toEqual(['kitProteins', 'kitBeans']) // nachos come without rice
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
  it('breaks a meal down line by line for the bag', () => {
    const half = sel({ protein: [{ name: 'Tofu', level: 'regular' }, { name: 'Grilled Steak', level: 'regular' }], toppings: [{ name: 'Pico de Gallo', level: 'light' }], addons: [{ name: 'Add Fresh Guac', level: 'regular' }, { name: 'Extra Protein', level: 'regular' }] })
    expect(breakdown(byo, half)).toEqual([
      { label: 'Bowl', cents: null },
      { label: '½ Tofu, ½ Grilled Steak', cents: 1395 },
      { label: 'Pico de Gallo (light)', cents: null },
      { label: 'Add Fresh Guac', cents: 195, add: true },
      { label: 'Double protein', cents: 295, add: true },
    ])
    expect(breakdown(findItem('churros'), {})).toEqual([{ label: 'Churros', cents: 395 }])
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
    expect(wrapper.findAll('.sec')).toHaveLength(8)
    await click(wrapper, 'Grilled Steak', '.bc__btn')
    await click(wrapper, 'Add Fresh Guac', '.bc__btn')
    expect(wrapper.find('.mbar__name').text()).toBe('Grilled Steak Bowl')
    expect(wrapper.find('.mbar').text()).not.toMatch(/\$\d/) // no price on the bottom bar
    expect(useOrder().draftUnit.value).toBe(1590)
    // ADD TO BAG asks who the meal is for (required), then opens the bag drawer
    await click(wrapper, 'Add to bag', '.mbar__add')
    const dialog = () => document.querySelector('.nm__box')
    expect(dialog().textContent).toContain("Who's this meal for?")
    dialog().querySelector('.nm__ok').click()
    await flushPromises()
    expect(dialog().textContent).toContain('Type a name')
    const input = dialog().querySelector('input')
    input.value = 'Sara'
    input.dispatchEvent(new Event('input'))
    dialog().querySelector('.nm__ok').click()
    await flushPromises()
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/order/brooklyn-5119-a-avenue-u'))
    await flushPromises()
    expect(useOrder().subtotal.value).toBe(1590)
    expect(useOrder().state.lines[0].label).toBe('Sara')
    const bag = document.querySelector('[aria-labelledby=bag-title]')
    expect(bag.querySelector('.line__name').textContent).toBe('Sara')
    expect(bag.querySelector('.line__sub').textContent).toBe('Bowl')
    expect(bag.textContent).toContain('+$1.95')
    expect(bag.querySelector('.line__total').textContent).toBe('$15.90')
    expect(bag.querySelector('[aria-label="Edit Sara"]')).not.toBeNull()
    expect(bag.querySelector('[aria-label="Duplicate Sara"]')).not.toBeNull()
    expect(bag.querySelector('[aria-label="Remove Sara"]')).not.toBeNull()
    expect(bag.textContent).toContain('Estimated tax') // sample NY rate until the owner confirms
    expect(bag.textContent).toContain('$17.31') // 15.90 + 8.875%
    expect(bag.textContent).toContain('Get rewarded')
    const ut = bag.querySelector('.ut input')
    ut.click()
    await flushPromises()
    expect(useOrder().state.utensils).toBe(true)
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
    expect(wrapper.find('.bc.radio img').exists()).toBe(false) // the Double card has no photo
    await click(wrapper, 'Double your protein', '.bc__btn')
    expect(useOrder().draftUnit.value).toBe(1690)
    // doubled half and half: each half becomes a full portion (1x)
    expect(wrapper.findAll('#sec-protein .bc__badge.half').map((b) => b.text())).toEqual(['1x', '1x'])
    await click(wrapper, 'Grilled Steak', '.bc__btn') // back to one protein, still doubled: 2x
    expect(wrapper.findAll('#sec-protein .bc__badge.half').map((b) => b.text())).toEqual(['2x'])
    await click(wrapper, 'Double your protein', '.bc__btn')
    expect(wrapper.findAll('#sec-protein .bc__badge.half')).toHaveLength(0)
    await click(wrapper, 'Mexican Rice', '.bc__btn')
    await click(wrapper, 'Cilantro Lime White Rice', '.bc__btn')
    expect(wrapper.findAll('#sec-rice .bc__badge.half')).toHaveLength(2)
    await click(wrapper, 'No Rice', '.bc__btn')
    expect(useOrder().state.draft.selections.rice).toEqual([])
    wrapper.unmount()
  })

  it('tags scroll to portions, mark the done ones, and the URL keeps the place', async () => {
    const { wrapper, router } = await mountAt(`${B}?base=bowl`)
    expect(wrapper.findAll('.tag').map((t) => t.text().replace(' (done)', ''))).toEqual(['Protein', 'Rice', 'Beans', 'Toppings', 'Sauce', 'Side cups', 'Drinks', 'Desserts'])
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

  it('side cups, drinks and desserts after the meal go into the bag as their own items', async () => {
    const { wrapper } = await mountAt(`${B}?base=bowl`)
    await click(wrapper, 'Grill Chicken', '.bc__btn')
    await click(wrapper, 'Side Cup of Beef', '.bc__btn')
    await click(wrapper, 'Water', '.bc__btn')
    await click(wrapper, 'Churros', '.bc__btn')
    expect(wrapper.find('.tag[data-key=drinks]').classes()).toContain('done')
    useOrder().setLabel('Ali')
    useOrder().commitDraft()
    expect(useOrder().state.lines.map((l) => l.itemSlug)).toEqual(['build-your-own', 'side-cup-beef', 'water', 'churros'])
    expect(useOrder().subtotal.value).toBe(1295 + 295 + 195 + 395)
    wrapper.unmount()
  })

  it('Return to menu goes straight to the menu page', async () => {
    const { wrapper } = await mountAt(`${B}?base=bowl`)
    expect(wrapper.find('a.back').attributes('href')).toBe('/menu')
    wrapper.unmount()
  })

  it('Jarritos needs a flavor; Tractor drinks carry the "Only at Guacado" tag', async () => {
    const { wrapper } = await mountAt(`${B}?base=bowl`)
    const drinks = wrapper.find('#sec-drinks')
    const tags = drinks.findAll('.bc').filter((c) => c.find('.bc__tag').exists()).map((c) => c.find('.bc__name').text())
    expect(tags).toEqual(['Tractor Tea', 'Tractor Lemonade', 'Tractor Mango', 'Tractor Strawberry Dragon Fruit'])
    expect(drinks.find('.bc__tag').text()).toBe('Only at Guacado')
    await click(wrapper, 'Grill Chicken', '.bc__btn')
    await click(wrapper, 'Jarritos', '.bc__btn')
    const chips = () => wrapper.findAll('#sec-drinks .chip')
    expect(chips().map((c) => c.text())).toEqual(['Pineapple', 'Guava', 'Mango', 'Tamarind', 'Fruit Punch', 'Orange', 'Watermelon'])
    // no flavor yet: ADD TO BAG points at the drinks instead of asking for a name
    await click(wrapper, 'Add to bag', '.mbar__add')
    expect(document.querySelector('.nm__box')).toBeNull()
    expect(wrapper.find('#sec-drinks .sec__err').text()).toBe('Choose a flavor for your drink.')
    await chips()[4].trigger('click')
    expect(wrapper.findAll('.bc').find((c) => c.text().includes('Jarritos')).find('.bc__note').text()).toBe('Fruit Punch')
    useOrder().setLabel('Ali')
    useOrder().commitDraft()
    const soda = useOrder().state.lines.find((l) => l.itemSlug === 'bottle-drink')
    expect(soda.selections.flavor).toEqual([{ name: 'Fruit Punch', level: 'regular' }])
    expect(useOrder().subtotal.value).toBe(1295 + 295)
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

  const F = '/order/brooklyn-5119-a-avenue-u/family'
  const nameAndConfirm = async (name) => {
    const box = document.querySelector('.nm__box')
    const input = box.querySelector('input')
    input.value = name
    input.dispatchEvent(new Event('input'))
    box.querySelector('.nm__ok').click()
    await flushPromises()
  }

  it('family meals: pick page with a card per kit; ADD TO BAG adds it as described', async () => {
    const { wrapper, router } = await mountAt(F)
    expect(wrapper.find('.hero__pre').text()).toBe('Pick your')
    expect(wrapper.find('.hero__t').text()).toBe('Family kits')
    expect(wrapper.findAll('.kc .kc__name').map((n) => n.text())).toEqual(['Taco Kit', 'Nacho Kit', 'Fajita Kit'])
    const taco = wrapper.findAll('.kc')[0]
    expect(taco.find('.kc__serves').text()).toBe('Serves 4–6 people')
    expect(taco.find('.kc__meta').text()).toMatch(/5900–6626 Cal\s*\$49\.95/)
    expect(taco.find('.kc__text').text()).toMatch(/^Grill Chicken & Grilled Steak, Mexican Rice, Black Beans, 12 soft corn tortillas/)
    expect(taco.find('.kc__custom').attributes('href')).toBe(`${F}/taco-kit`)
    await taco.find('.kc__add').trigger('click')
    await nameAndConfirm('Team')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/order/brooklyn-5119-a-avenue-u'))
    const [line] = useOrder().state.lines
    expect(line).toMatchObject({ itemSlug: 'taco-kit', label: 'Team' })
    expect(line.selections.kitProteins.map((p) => p.name)).toEqual(['Grill Chicken', 'Grilled Steak'])
    expect(useOrder().subtotal.value).toBe(4995)
    expect(document.querySelector('[aria-labelledby=bag-title] .line__name').textContent).toBe('Team')
    wrapper.unmount()
  })

  it('family meals: customize a kit (two proteins, rice, beans, included, add-ons)', async () => {
    const { wrapper } = await mountAt(`${F}/taco-kit`)
    expect(wrapper.find('.hero__t').text()).toBe('Taco Kit')
    expect(wrapper.findAll('.sec__t').map((h) => h.text())).toEqual(['Protein | Choose two', 'Rice | Choose one', 'Beans | Choose one', 'Included', 'Add-ons'])
    const included = wrapper.findAll('.bc.locked')
    expect(included.map((c) => c.find('.bc__name').text())).toContain('12 soft corn tortillas')
    included.forEach((c) => expect(c.find('.bc__btn').attributes('disabled')).toBeDefined())
    expect(wrapper.find('.mbar__name').text()).toBe('Taco Kit - Grill Chicken & Grilled Steak')
    await click(wrapper, 'Grill Chicken', '#sec-kitProteins .bc__btn') // one protein left
    await click(wrapper, 'Add to bag', '.mbar__add')
    expect(document.querySelector('.nm__box')).toBeNull()
    expect(wrapper.find('#sec-kitProteins .sec__err').text()).toBe('Pick exactly 2.')
    await click(wrapper, 'Tofu', '#sec-kitProteins .bc__btn')
    await click(wrapper, 'Pinto Beans', '.bc__btn')
    await click(wrapper, 'Large Guacamole', '.bc__btn')
    await click(wrapper, 'Add to bag', '.mbar__add')
    await nameAndConfirm('Office')
    const lines = useOrder().state.lines
    expect(lines.map((l) => l.itemSlug)).toEqual(['taco-kit', 'guacamole'])
    expect(lines[0].selections.kitProteins.map((p) => p.name)).toEqual(['Grilled Steak', 'Tofu'])
    expect(lines[0].selections.kitBeans).toEqual(pick('Pinto Beans'))
    expect(lines[1].selections.size).toEqual(pick('8 oz'))
    expect(useOrder().subtotal.value).toBe(4995 + 695)
    wrapper.unmount()
  })

  const K = '/order/brooklyn-5119-a-avenue-u/kids'

  it('kids meal: Family Kit style picker, then the item builder with its photo up top', async () => {
    const { wrapper, router } = await mountAt(K)
    expect(wrapper.find('.hero__pre').text()).toBe('Pick your')
    expect(wrapper.find('.hero__t').text()).toBe('Kids meals')
    expect(wrapper.findAll('.kc__name').map((n) => n.text())).toEqual(['Kids Create Your Own', 'Kids Cheese Quesadilla'])
    const [byo, quesadilla] = wrapper.findAll('.kc')
    expect(byo.find('.kc__meta').text()).toMatch(/300–530 Cal\s*\$8\.95/)
    // both cards: ADD TO BAG (as described) + CUSTOMIZE
    ;[byo, quesadilla].forEach((c) => {
      expect(c.find('.kc__add').text()).toContain('Add to bag')
      expect(c.find('.kc__custom').text()).toContain('Customize')
    })
    expect(byo.find('.kc__text').text()).toBe('Grill Chicken with rice and shredded cheese, 2 soft tortillas, and organic milk.')
    expect(quesadilla.find('.kc__custom').attributes('href')).toBe(`${K}/kids-cheese-quesadilla`)
    await byo.find('.kc__custom').trigger('click')
    await flushPromises()
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe(`${K}/kids-create-your-own`))
    await flushPromises()
    expect(wrapper.find('.hero__t').text()).toBe('Kids Create Your Own')
    expect(wrapper.find('.hero__img img').attributes('src')).toBe('/media/menu/tacos.webp')
    expect(wrapper.findAll('.sec__t').map((h) => h.text())).toEqual(['Tortilla', 'Protein or veggie', 'Toppings | Choose two', 'Drink | Choose one', 'Add-ons'])
    expect(wrapper.findAll('#sec-shell .bc__name').map((n) => n.text())).toEqual(['2 Soft Tortillas', '2 Crispy Tortillas'])
    expect(wrapper.find('.mbar__name').text()).toBe('Select a protein or veggie to get started')
    // missing protein and toppings: ADD TO BAG points at them instead of asking for a name
    await click(wrapper, 'Add to bag', '.mbar__add')
    expect(document.querySelector('.nm__box')).toBeNull()
    expect(wrapper.find('#sec-main .sec__err').exists()).toBe(true)
    await click(wrapper, 'Grilled Steak', '#sec-main .bc__btn')
    await click(wrapper, 'Rice', '#sec-toppings .bc__btn')
    await click(wrapper, 'Shredded Cheese', '#sec-toppings .bc__btn')
    expect(wrapper.find('.mbar__name').text()).toBe('Kids Create Your Own - Grilled Steak')
    await click(wrapper, 'Add to bag', '.mbar__add')
    await nameAndConfirm('Mia')
    const [line] = useOrder().state.lines
    expect(line).toMatchObject({ itemSlug: 'kids-create-your-own', label: 'Mia' })
    expect(line.selections.toppings.map((p) => p.name)).toEqual(['Rice', 'Shredded Cheese'])
    expect(useOrder().subtotal.value).toBe(895)
    wrapper.unmount()
  })

  it('kids meal: the quesadilla page shows what is included, the drink and add-ons; links use the kids pages', async () => {
    const { wrapper } = await mountAt(`${K}/kids-cheese-quesadilla`)
    expect(wrapper.findAll('.sec__t').map((h) => h.text())).toEqual(['Included', 'Drink | Choose one', 'Add-ons'])
    expect(wrapper.find('.bc.locked .bc__name').text()).toBe('Cheese quesadilla')
    expect(wrapper.findAll('#sec-addons .bc__name').map((n) => n.text())).toEqual(['Chips', 'Churros', 'Plantains'])
    expect(wrapper.find('.mbar__name').text()).toBe('Kids Cheese Quesadilla')
    await click(wrapper, 'Water', '#sec-drink .bc__btn')
    await click(wrapper, 'Churros', '#sec-addons .bc__btn')
    await click(wrapper, 'Add to bag', '.mbar__add')
    await nameAndConfirm('Leo')
    expect(useOrder().state.lines.map((l) => l.itemSlug)).toEqual(['kids-cheese-quesadilla', 'churros'])
    expect(useOrder().state.lines[0].selections.drink).toEqual(pick('Water'))
    expect(useOrder().subtotal.value).toBe(895 + 395)
    wrapper.unmount()
    useOrder().chooseStore('brooklyn-5119-a-avenue-u')
    const a = await mountAt('/order?go=kids')
    expect(a.router.currentRoute.value.path).toBe(K)
    a.wrapper.unmount()
    const b = await mountAt('/order/brooklyn-5119-a-avenue-u')
    expect(b.wrapper.find('[aria-label="Choose options for Kids Create Your Own"]').attributes('href')).toBe(`${K}/kids-create-your-own`)
    b.wrapper.unmount()
  })

  it('kids meal: ADD TO BAG on the Create Your Own card adds the meal it describes', async () => {
    const { wrapper } = await mountAt(K)
    await wrapper.findAll('.kc')[0].find('.kc__add').trigger('click')
    await nameAndConfirm('Noah')
    const [line] = useOrder().state.lines
    expect(line.selections).toMatchObject({ main: pick('Grill Chicken'), toppings: [...pick('Rice'), ...pick('Shredded Cheese')], shell: pick('Soft'), drink: pick('Organic Milk') })
    expect(useOrder().subtotal.value).toBe(895)
    wrapper.unmount()
  })

  it('kids meal: ADD TO BAG on the quesadilla card adds it with organic milk', async () => {
    const { wrapper, router } = await mountAt(K)
    await wrapper.findAll('.kc')[1].find('.kc__add').trigger('click')
    await nameAndConfirm('Ava')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/order/brooklyn-5119-a-avenue-u'))
    const [line] = useOrder().state.lines
    expect(line).toMatchObject({ itemSlug: 'kids-cheese-quesadilla', label: 'Ava' })
    expect(line.selections.drink).toEqual(pick('Organic Milk'))
    wrapper.unmount()
  })

  const C = '/order/brooklyn-5119-a-avenue-u/catering'
  const later = (days) => {
    const d = new Date(Date.now() + days * 864e5)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  it('catering page: Build Your Own tiers, popular builds with a headcount, chips & dips, burrito box', async () => {
    const { wrapper } = await mountAt('/catering')
    const tiers = wrapper.findAll('.tier')
    expect(tiers.map((t) => t.find('.tier__n').text())).toEqual(['Single', 'Double', 'Triple'])
    expect(tiers[0].attributes('aria-checked')).toBe('true')
    expect(wrapper.find('.byo .btn-gold').attributes('href')).toBe('/order?go=catering:catering-single')
    await tiers[1].trigger('click')
    expect(wrapper.find('.byo .btn-gold').text()).toContain('Build your Double')
    expect(wrapper.find('.byo .btn-gold').attributes('href')).toBe('/order?go=catering:catering-double')
    expect(wrapper.findAll('.pc h3').map((h) => h.text())).toEqual(['Office Lunch', 'Plant Powered', 'Big Get-Together', 'Burritos by the Box'])
    const office = wrapper.findAll('.pc')[0]
    await office.find('select').setValue('25')
    expect(office.find('.pc__add').attributes('href')).toBe('/order?go=catering:office-lunch:25')
    expect(wrapper.find('#cd-t').text()).toBe('Chips & dips')
    expect(wrapper.find('#bx-t').text()).toContain('by the box')
    wrapper.unmount()
  })

  it('catering order: event details (24 hours ahead) -> build -> who is it for -> bag, priced per person', async () => {
    useOrder().chooseStore('brooklyn-5119-a-avenue-u')
    const { wrapper, router } = await mountAt('/order?go=catering:catering-double:20')
    expect(router.currentRoute.value.fullPath).toBe(`${C}/catering-double?people=20`)
    expect(wrapper.find('.ed__t').text()).toBe('Event details')
    expect(wrapper.find('.fld__store').text()).toContain('5119-A Avenue U')
    const form = wrapper.find('.ed__form')
    // too soon: tomorrow is fine only if it's 24h+ away, today never is
    await form.find('input[type=date]').setValue(later(0))
    await form.find('select').setValue('12:00')
    await form.trigger('submit')
    expect(wrapper.find('.ed__err').text()).toContain('24 hours')
    await form.find('input[type=date]').setValue(later(3))
    await form.trigger('submit')
    await flushPromises()
    expect(wrapper.find('.hero__t').text()).toBe('Double')
    expect(wrapper.findAll('.sec__t').map((h) => h.text())).toEqual(['Protein | Choose two', 'Bases | Choose two', 'Toppings | Choose two', 'Salsas | Choose two', 'Tortillas | Choose one'])
    await click(wrapper, 'Add to bag', '.mbar__add')
    expect(document.querySelector('.nm__box')).toBeNull() // choices missing
    for (const [sec, names] of Object.entries({ protein: ['Grill Chicken', 'Grilled Steak'], bases: ['Mexican Rice', 'Black Beans'], toppings: ['Romaine Lettuce', 'Shredded Cheese'], salsas: ['Pico de Gallo', 'Green Salsa Verde'], tortillas: ['Soft Corn Tortillas'] })) {
      for (const n of names) await click(wrapper, n, `#sec-${sec} .bc__btn`)
    }
    expect(wrapper.find('.mbar__name').text()).toBe('Build Your Own Double · 20 people · $259.00')
    await click(wrapper, 'Add to bag', '.mbar__add')
    expect(document.querySelector('.nm__t').textContent).toBe("Who's this order for?")
    await nameAndConfirm('Team lunch')
    const [line] = useOrder().state.lines
    expect(line).toMatchObject({ itemSlug: 'catering-double', qty: 20, label: 'Team lunch', event: { date: later(3), time: '12:00' } })
    expect(useOrder().subtotal.value).toBe(1295 * 20)
    const bag = document.querySelector('[aria-labelledby=bag-title]')
    expect(bag.textContent).toContain('20 people')
    expect(bag.textContent).toMatch(/Pickup \w{3}, \w{3} \d+ · 12:00/)
    // the people stepper moves in fives and stops at the minimum
    useOrder().setLineQty(line.id, 5)
    expect(useOrder().state.lines[0].qty).toBe(10)
    wrapper.unmount()
  })

  it('catering order: a popular build skips the build step', async () => {
    useOrder().chooseStore('brooklyn-5119-a-avenue-u')
    const { wrapper } = await mountAt(`${C}/office-lunch?people=30`)
    const form = wrapper.find('.ed__form')
    expect(form.find('.ed__go').text()).toBe('Save & add to bag')
    await form.find('input[type=date]').setValue(later(2))
    await form.findAll('select')[0].setValue('11:30')
    await form.trigger('submit')
    await flushPromises()
    await nameAndConfirm('Board meeting')
    const [line] = useOrder().state.lines
    expect(line).toMatchObject({ itemSlug: 'office-lunch', qty: 30 })
    expect(useOrder().subtotal.value).toBe(1295 * 30)
    wrapper.unmount()
  })

  it('drinks use the new item page: Jarritos flavor cards, then straight into the bag', async () => {
    const { wrapper, router } = await mountAt('/order/brooklyn-5119-a-avenue-u/item/bottle-drink')
    expect(wrapper.find('.hero__t').text()).toBe('Jarritos')
    expect(wrapper.find('.sec__t').text()).toBe('Flavor | Choose one')
    expect(wrapper.findAll('.bc__name').map((n) => n.text())).toContain('Tamarind')
    await click(wrapper, 'Add to bag', '.mbar__add')
    expect(wrapper.find('.sec__err').exists()).toBe(true)
    await click(wrapper, 'Mango', '.bc__btn')
    await click(wrapper, 'Add to bag', '.mbar__add') // drinks skip the name step
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/order/brooklyn-5119-a-avenue-u'))
    expect(useOrder().state.lines[0]).toMatchObject({ itemSlug: 'bottle-drink', selections: { flavor: pick('Mango') } })
    wrapper.unmount()
  })

  it('drinks page: every drink as a card; choice drinks need a pick, the rest add straight away', async () => {
    const { wrapper, router } = await mountAt('/order/brooklyn-5119-a-avenue-u/drinks')
    expect(wrapper.find('.hero__t').text()).toBe('Drinks')
    const names = wrapper.findAll('.dc__name').map((n) => n.text())
    expect(names).toEqual(expect.arrayContaining(['Jarritos', 'Mexican Soda', 'Red Bull', 'Tractor Strawberry Dragon Fruit', 'Can Soda', 'Organic Milk Chocolate', 'Water']))
    const card = (name) => wrapper.findAll('.dc').find((c) => c.find('.dc__name').text() === name)
    await card('Mexican Soda').find('.dc__add').trigger('click')
    expect(card('Mexican Soda').find('.dc__err').exists()).toBe(true)
    expect(useOrder().state.lines).toHaveLength(0)
    await card('Mexican Soda').findAll('.chip').find((c) => c.text() === 'Sprite').trigger('click')
    await card('Mexican Soda').find('.dc__add').trigger('click')
    await card('Red Bull').find('.dc__add').trigger('click')
    expect(useOrder().state.lines).toMatchObject([
      { itemSlug: 'mexican-soda', selections: { flavor: pick('Sprite') } },
      { itemSlug: 'red-bull', qty: 1 },
    ])
    expect(router.currentRoute.value.path).toBe('/order/brooklyn-5119-a-avenue-u/drinks') // stays to add more
    wrapper.unmount()
  })

  it('sides & desserts pages: dips start at 4 oz, the size sets price and photo; Oreo churros add straight away', async () => {
    const { wrapper } = await mountAt('/order/brooklyn-5119-a-avenue-u/sides')
    expect(wrapper.find('.hero__t').text()).toBe('Sides & dips')
    expect(wrapper.findAll('.shelf__t').map((h) => h.text())).toEqual(['Sides', 'Dips & chips'])
    const card = (name) => wrapper.findAll('.dc').find((c) => c.find('.dc__name').text() === name)
    expect(card('Chips & Queso').find('.dc__price').text()).toBe('$6.45')
    await card('Chips & Queso').findAll('.chip').find((c) => c.text() === '8 oz').trigger('click')
    expect(card('Chips & Queso').find('.dc__price').text()).toBe('$8.95')
    expect(card('Chips & Queso').find('img').attributes('src')).toBe('/media/sides/chips-queso-8oz.webp')
    await card('Chips & Queso').find('.dc__add').trigger('click')
    expect(useOrder().state.lines[0]).toMatchObject({ itemSlug: 'chips-queso', selections: { size: pick('8 oz') } })
    wrapper.unmount()

    const d = await mountAt('/order/brooklyn-5119-a-avenue-u/desserts')
    expect(d.wrapper.findAll('.dc__name').map((n) => n.text())).toEqual(['Churros', 'Oreo Churros', 'Tres Leches Cake', 'Plantains'])
    await d.wrapper.findAll('.dc__add')[1].trigger('click')
    expect(useOrder().state.lines.at(-1)).toMatchObject({ itemSlug: 'oreo-churros', qty: 1 })
    d.wrapper.unmount()
  })

  it('family meals: deep link go=family and the order menu send kits to the family pages', async () => {
    useOrder().chooseStore('brooklyn-5119-a-avenue-u')
    const a = await mountAt('/order?go=family')
    expect(a.router.currentRoute.value.path).toBe(F)
    a.wrapper.unmount()
    const b = await mountAt('/order/brooklyn-5119-a-avenue-u')
    expect(b.wrapper.find('[aria-label="Choose options for Taco Kit"]').attributes('href')).toBe(`${F}/taco-kit`)
    b.wrapper.unmount()
  })

  it('quick add, bag sheet and checkout (payment stays off)', async () => {
    const { wrapper, router } = await mountAt('/order/brooklyn-5119-a-avenue-u')
    await wrapper.find('[aria-label="Add Chips to bag"]').trigger('click')
    expect(wrapper.find('.bar__total').exists()).toBe(false)
    expect(wrapper.find('.bar__cap').text()).toContain('1 in your bag')
    await click(wrapper, 'VIEW BAG')
    const sheet = document.querySelector('[role=dialog]')
    expect(sheet.textContent).toContain('Chips')
    expect(sheet.querySelector('.line__total').textContent).toBe('$2.95')
    sheet.querySelector('[aria-label="Close bag"]').click()
    await flushPromises()
    expect(document.querySelector('[role=dialog]')).toBeNull()
    wrapper.unmount()
    const co = await mountAt('/order/checkout')
    expect(co.wrapper.text()).toContain('Online payment isn')
    expect(co.wrapper.text()).toContain('Estimated tax')
    expect(co.wrapper.text()).toContain('Napkins & utensils: not included')
    expect(co.wrapper.find('.bar button').attributes('disabled')).toBeDefined()
    expect(router).toBeTruthy()
    co.wrapper.unmount()
  })
})
