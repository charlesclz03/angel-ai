import type { Metadata } from 'next'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/ui/Card'
import { latestPatchNote, patchNotes } from '@/lib/data/patch-notes'

export const metadata: Metadata = {
  title: 'Updates | Angel AI',
  description:
    'Recent shipped Angel AI product updates, verification notes, and release highlights.',
}

const patchNoteDateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long',
  timeZone: 'UTC',
})

export default function UpdatesPage() {
  const featuredNote = latestPatchNote
  const archiveNotes = patchNotes.slice(1)

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-midnight" />
      <div className="pointer-events-none absolute left-[-10rem] top-0 -z-10 h-80 w-80 rounded-full bg-accent-primary/14 blur-3xl motion-safe:animate-drift" />
      <div className="pointer-events-none absolute right-[-8rem] top-24 -z-10 h-72 w-72 rounded-full bg-accent-brand/10 blur-3xl motion-safe:animate-ambient-shift" />

      <section className="angel-shell py-10 sm:py-12">
        <div className="angel-chat-arrival animate-enter">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <span className="angel-eyebrow">Angel AI / Updates</span>
              <h1 className="mt-5 max-w-3xl font-display text-[clamp(2rem,4vw,3.4rem)] leading-[0.96] tracking-[-0.05em] text-text-primary">
                Recent shipped work, without leaving the product.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
                This is the readable release trail for Angel AI: what landed,
                how it was verified, and where the product moved most recently.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="quiet">
                <Link href="/chat">Open chat</Link>
              </Button>
              <Button asChild variant="link">
                <Link href="/">
                  Back home
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {featuredNote ? (
          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(19rem,0.7fr)]">
            <Card variant="frosted" padding="lg" className="animate-enter">
              <div className="flex flex-wrap items-center gap-3">
                <span className="angel-chat-chip">{featuredNote.version}</span>
                <span className="text-xs uppercase tracking-[0.24em] text-text-tertiary">
                  {formatPatchNoteDate(featuredNote.date)}
                </span>
              </div>

              <div className="mt-5 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent-primary/20 bg-accent-primary/10 text-accent-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="angel-kicker">Latest shipped slice</p>
                  <h2 className="mt-2 font-display text-[2rem] leading-[1.02] tracking-[-0.05em] text-text-primary">
                    {featuredNote.title}
                  </h2>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-text-secondary sm:text-base sm:leading-8">
                    {featuredNote.summary}
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {featuredNote.highlights.map((highlight) => (
                  <div
                    key={highlight}
                    className="flex items-start gap-3 text-sm leading-7 text-text-secondary"
                  >
                    <span className="mt-2 h-2 w-2 rounded-full bg-accent-primary" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card variant="rail" padding="lg" className="animate-enter">
              <p className="angel-kicker">Verification trail</p>
              <h2 className="mt-3 font-display text-[1.65rem] tracking-[-0.04em] text-text-primary">
                What we ran before calling it shipped.
              </h2>

              <div className="mt-6 flex flex-wrap gap-2">
                {featuredNote.verification.map((command) => (
                  <code
                    key={command}
                    className="angel-chat-chip text-[0.72rem] text-text-secondary"
                  >
                    {command}
                  </code>
                ))}
              </div>

              <div className="mt-8 border-t border-white/8 pt-6 text-sm leading-7 text-text-secondary">
                The source of truth stays in the repo patch notes, handoff, and
                progress log. This page is the product-facing readout.
              </div>
            </Card>
          </div>
        ) : (
          <Card variant="soft" padding="lg" className="mt-8 animate-enter">
            <p className="text-sm leading-7 text-text-secondary">
              Patch notes are not available yet. Once releases land, this page
              will surface the latest shipped slices here.
            </p>
          </Card>
        )}

        {archiveNotes.length > 0 ? (
          <div className="mt-10 animate-enter">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="angel-kicker">Release archive</p>
                <h2 className="mt-3 font-display text-[clamp(1.7rem,3vw,2.6rem)] tracking-[-0.045em] text-text-primary">
                  The recent trail behind today&apos;s build.
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-text-secondary">
                Older releases stay readable here so the product history is
                visible without needing the repo open.
              </p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {archiveNotes.map((note) => (
                <Card
                  key={note.slug}
                  variant="soft"
                  padding="lg"
                  hover
                  className="h-full"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="angel-chat-chip">{note.version}</span>
                    <span className="text-xs uppercase tracking-[0.24em] text-text-tertiary">
                      {formatPatchNoteDate(note.date)}
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-[1.5rem] leading-[1.08] tracking-[-0.04em] text-text-primary">
                    {note.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-text-secondary">
                    {note.summary}
                  </p>

                  <div className="mt-5 space-y-3">
                    {note.highlights.slice(0, 3).map((highlight) => (
                      <div
                        key={highlight}
                        className="flex items-start gap-3 text-sm leading-7 text-text-secondary"
                      >
                        <span className="mt-2 h-2 w-2 rounded-full bg-accent-brand" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>

                  {note.verification.length > 0 ? (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {note.verification.slice(0, 2).map((command) => (
                        <code
                          key={command}
                          className="angel-chat-chip text-[0.72rem] text-text-secondary"
                        >
                          {command}
                        </code>
                      ))}
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  )
}

function formatPatchNoteDate(value: string) {
  return patchNoteDateFormatter.format(new Date(`${value}T00:00:00.000Z`))
}
