import { describe, expect, it } from 'vitest'
import { goPath } from '@/order/lib/go'

describe('goPath: where a website flavor tile lands in the order flow', () => {
  const s = 'brooklyn-test'
  it('build goes to the builder', () => {
    expect(goPath(s, 'build')).toEqual({ path: `/order/${s}/build` })
  })
  it('items with choices open their options page', () => {
    expect(goPath(s, 'item:birria-tacos')).toEqual({ path: `/order/${s}/item/birria-tacos` })
    expect(goPath(s, 'item:tacos')).toEqual({ path: `/order/${s}/item/tacos` })
  })
  it('categories scroll the menu to that section', () => {
    expect(goPath(s, 'cat:kids')).toEqual({ path: `/order/${s}`, hash: '#cat-kids' })
    expect(goPath(s, 'cat:beverages')).toEqual({ path: `/order/${s}`, hash: '#cat-beverages' })
  })
  it('unknown or missing targets land on the store menu', () => {
    for (const bad of [undefined, '', 'item:nope', 'cat:nope', '//evil.com', 'javascript:1', ['build']]) {
      const r = goPath(s, bad)
      expect(r.path.startsWith(`/order/${s}`)).toBe(true)
    }
    expect(goPath(s, ['build'])).toEqual({ path: `/order/${s}/build` })
  })
})
