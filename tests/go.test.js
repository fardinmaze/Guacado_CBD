import { describe, expect, it } from 'vitest'
import { goPath } from '@/order/lib/go'

describe('goPath: where a website flavor tile lands in the order flow', () => {
  const s = 'brooklyn-test'
  it('build goes to the builder', () => {
    expect(goPath(s, 'build')).toEqual({ path: `/order/${s}/build` })
    expect(goPath(s, 'build:burrito')).toEqual({ path: `/order/${s}/build`, query: { base: 'burrito' } })
    expect(goPath(s, 'family')).toEqual({ path: `/order/${s}/family` })
    expect(goPath(s, 'family:taco-kit')).toEqual({ path: `/order/${s}/family/taco-kit` })
    expect(goPath(s, 'family:chips')).toEqual({ path: `/order/${s}` })
    expect(goPath(s, 'kids')).toEqual({ path: `/order/${s}/kids` })
    expect(goPath(s, 'catering:office-lunch:25')).toEqual({ path: `/order/${s}/catering/office-lunch`, query: { people: '25' } })
    expect(goPath(s, 'catering:catering-single')).toEqual({ path: `/order/${s}/catering/catering-single` })
    expect(goPath(s, 'catering:chips')).toEqual({ path: `/order/${s}` })
    expect(goPath(s, 'kids:kids-cheese-quesadilla')).toEqual({ path: `/order/${s}/kids/kids-cheese-quesadilla` })
  })
  it('items with choices open their options page', () => {
    expect(goPath(s, 'item:birria-tacos')).toEqual({ path: `/order/${s}/item/birria-tacos` })
    expect(goPath(s, 'item:tacos')).toEqual({ path: `/order/${s}/item/tacos` })
  })
  it('categories scroll the menu to that section', () => {
    expect(goPath(s, 'cat:kids')).toEqual({ path: `/order/${s}`, hash: '#cat-kids' })
    expect(goPath(s, 'cat:beverages')).toEqual({ path: `/order/${s}/drinks` })
    expect(goPath(s, 'drinks')).toEqual({ path: `/order/${s}/drinks` })
    expect(goPath(s, 'sides')).toEqual({ path: `/order/${s}/sides` })
    expect(goPath(s, 'cat:dips')).toEqual({ path: `/order/${s}/sides` })
    expect(goPath(s, 'desserts')).toEqual({ path: `/order/${s}/desserts` })
    expect(goPath(s, 'item:chips-guac')).toEqual({ path: `/order/${s}/sides` })
  })
  it('unknown or missing targets land on the store menu', () => {
    for (const bad of [undefined, '', 'item:nope', 'cat:nope', '//evil.com', 'javascript:1', ['build']]) {
      const r = goPath(s, bad)
      expect(r.path.startsWith(`/order/${s}`)).toBe(true)
    }
    expect(goPath(s, ['build'])).toEqual({ path: `/order/${s}/build` })
  })
})
