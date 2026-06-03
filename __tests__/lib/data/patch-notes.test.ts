import { describe, expect, it } from 'vitest'

import { latestPatchNote, patchNotes } from '@/lib/data/patch-notes'

describe('patch notes data', () => {
  it('parses the master patch notes doc into newest-first entries', () => {
    expect(patchNotes.length).toBeGreaterThan(0)
    expect(latestPatchNote?.version).toBe(patchNotes[0]?.version)
    expect(latestPatchNote?.title).toBe(patchNotes[0]?.title)
    expect(latestPatchNote?.title.length).toBeGreaterThan(0)
    expect(latestPatchNote?.summary.length).toBeGreaterThan(0)
    expect(latestPatchNote?.highlights.length).toBeGreaterThan(0)
    expect(latestPatchNote?.verification.length).toBeGreaterThan(0)
  })
})
