import { describe, expect, it } from 'vitest'

import {
  buildSoulMarkdown,
  buildUserMarkdown,
  parseListInput,
  prototypeSoulSeed,
  prototypeUserSeed,
} from '@/lib/angel/memory'

describe('angel memory helpers', () => {
  it('builds a user markdown portrait from the prototype seed', () => {
    const markdown = buildUserMarkdown(prototypeUserSeed)

    expect(markdown).toContain('# user.md')
    expect(markdown).toContain(prototypeUserSeed.preferredName)
    expect(markdown).toContain('Starts as a friend and can grow naturally')
  })

  it('builds a soul markdown portrait from the prototype seed', () => {
    const markdown = buildSoulMarkdown(prototypeSoulSeed)

    expect(markdown).toContain('# soul.md')
    expect(markdown).toContain(prototypeSoulSeed.angelName)
    expect(markdown).toContain('New connection')
  })

  it('normalizes comma-separated inputs into distinct trimmed values', () => {
    expect(parseListInput('music, reels, , music, late chats')).toEqual([
      'music',
      'reels',
      'late chats',
    ])
  })
})
