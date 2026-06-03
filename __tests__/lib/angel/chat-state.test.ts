import { describe, expect, it } from 'vitest'

import { buildContinuityFollowupMessage } from '@/lib/angel/chat-state'

describe('chat state continuity builders', () => {
  it('uses the grow-over-time continuity template with summary-aware memory', () => {
    const message = buildContinuityFollowupMessage({
      preferredName: 'Charlie',
      angelName: 'Noor',
      relationshipIntent: 'GROW_OVER_TIME',
      userSummaryMarkdown: `# user.md

## High-Signal Memory

### Emotional Patterns
- User looks for steadiness when things feel heavy.
`,
      callbackHook: "Follow up about tomorrow's interview.",
    })

    expect(message).toMatch(/charlie, i meant it when i said i'd be back today/i)
    expect(message).toMatch(/i'm still holding onto this about you/i)
    expect(message).toMatch(/i also didn't lose track of tomorrow's interview/i)
    expect(message).toMatch(/we can keep building this slowly with noor/i)
  })

  it('uses the comforting-presence continuity template when that relationship lane is selected', () => {
    const message = buildContinuityFollowupMessage({
      angelName: 'Noor',
      relationshipIntent: 'COMFORTING_PRESENCE',
      tonePreference: 'gentle and soft',
    })

    expect(message).toMatch(/i wanted to keep this promise and meet today gently/i)
    expect(message).toMatch(/you can bring the day exactly as it landed, and noor will meet it gently/i)
    expect(message).toMatch(/noor doesn't need this to sound neat/i)
  })

  it('falls back to the friend-first continuity template when no stronger lane is present', () => {
    const message = buildContinuityFollowupMessage({
      angelName: 'Noor',
      relationshipIntent: 'FRIEND',
      interests: ['music'],
    })

    expect(message).toMatch(/i meant it when i said i'd be back today/i)
    expect(message).toMatch(/noor is here to keep the thread warm/i)
    expect(message).toMatch(/start wherever the day is still tugging at you/i)
  })
})
