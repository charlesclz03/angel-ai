import fs from 'node:fs'
import path from 'node:path'

export interface PatchNoteEntry {
  slug: string
  version: string
  date: string
  title: string
  summary: string
  highlights: string[]
  verification: string[]
  docs?: string[]
}

const PATCH_NOTES_MASTER_PATH = path.join(
  process.cwd(),
  'docs',
  'reference',
  'PATCH_NOTES_MASTER.md'
)

const patchNoteLabels = [
  'Completed',
  'Verification',
  'Notes',
  'Recommendation',
  'Result',
] as const

export function parsePatchNotesMarkdown(markdown: string): PatchNoteEntry[] {
  const normalized = markdown.replace(/\r\n/g, '\n').trim()
  const sections = normalized.split(/^## /m).slice(1)

  return sections
    .map((section) => parsePatchNoteSection(section))
    .filter((entry): entry is PatchNoteEntry => entry !== null)
}

function parsePatchNoteSection(section: string): PatchNoteEntry | null {
  const normalized = section.trim()

  if (!normalized) {
    return null
  }

  const firstLineBreak = normalized.indexOf('\n')

  if (firstLineBreak === -1) {
    return null
  }

  const header = normalized.slice(0, firstLineBreak).trim()
  const body = normalized.slice(firstLineBreak + 1).trim()
  const [date, version] = header.split('|').map((value) => value.trim())
  const titleMatch = body.match(/^###\s+(.+)$/m)

  if (!date || !version || !titleMatch) {
    return null
  }

  const title = titleMatch[1].trim()
  const afterTitle = body.slice((titleMatch.index ?? 0) + titleMatch[0].length)
  const summaryBlock = getSummaryBlock(afterTitle)
  const highlights = parseBulletList(extractLabelBlock(body, 'Completed'))
  const verification = parseBulletList(extractLabelBlock(body, 'Verification'))

  return {
    slug: slugify(`${version}-${title}`),
    version,
    date,
    title,
    summary: collapseWhitespace(summaryBlock || highlights[0] || ''),
    highlights,
    verification,
  }
}

function getSummaryBlock(sectionBody: string) {
  const trimmed = sectionBody.trimStart()
  const completedIndex = trimmed.indexOf('\nCompleted:')
  return completedIndex === -1
    ? trimmed.trim()
    : trimmed.slice(0, completedIndex).trim()
}

function extractLabelBlock(
  sectionBody: string,
  label: (typeof patchNoteLabels)[number]
) {
  const labelToken = `${label}:`
  const labelIndex = sectionBody.indexOf(labelToken)

  if (labelIndex === -1) {
    return ''
  }

  const otherLabels = patchNoteLabels
    .filter((candidate) => candidate !== label)
    .join('|')
  const trailingSectionPattern = new RegExp(`\\n(?:${otherLabels}):`)
  let block = sectionBody.slice(labelIndex + labelToken.length).trimStart()
  const nextSectionMatch = block.match(trailingSectionPattern)

  if (nextSectionMatch?.index !== undefined) {
    block = block.slice(0, nextSectionMatch.index)
  }

  return block.trim()
}

function parseBulletList(block: string) {
  return block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => normalizeBulletValue(line.slice(2).trim()))
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeBulletValue(value: string) {
  return value.startsWith('`') && value.endsWith('`')
    ? value.slice(1, -1)
    : value
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function loadPatchNotes() {
  try {
    return parsePatchNotesMarkdown(
      fs.readFileSync(PATCH_NOTES_MASTER_PATH, 'utf8')
    )
  } catch {
    return []
  }
}

export const patchNotes = loadPatchNotes()
export const latestPatchNote = patchNotes[0] ?? null
