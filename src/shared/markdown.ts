import type { CarryLineMeta, PaneKey, SelectableCarryLine } from './types.js'

export interface ParsedSection {
  heading: string | null
  lines: string[]
}

export function parseMarkdownSections(content: string): ParsedSection[] {
  const sections: ParsedSection[] = []
  let current: ParsedSection = { heading: null, lines: [] }

  for (const line of content.split(/\r?\n/)) {
    if (/^#{1,6}\s+/.test(line.trim())) {
      if (current.heading !== null || current.lines.length > 0) {
        sections.push(current)
      }
      current = {
        heading: line.trim().replace(/^#{1,6}\s+/, ''),
        lines: [],
      }
      continue
    }
    current.lines.push(line)
  }

  if (current.heading !== null || current.lines.length > 0) {
    sections.push(current)
  }

  return sections
}

export function selectableLinesFromPane(
  pane: PaneKey,
  content: string,
  meta: CarryLineMeta[],
  currentFilename: string,
): SelectableCarryLine[] {
  const metaPool = [...meta]
  const results: SelectableCarryLine[] = []

  for (const section of parseMarkdownSections(content)) {
    for (const rawLine of section.lines) {
      const text = rawLine.trim()
      if (!text) {
        continue
      }

      const metaIndex = metaPool.findIndex((entry) => entry.text === text)
      const matched = metaIndex >= 0 ? metaPool.splice(metaIndex, 1)[0] : null

      results.push({
        id: `${pane}:${section.heading ?? 'root'}:${text}:${results.length}`,
        pane,
        text,
        heading: section.heading,
        carryCount: matched?.carryCount ?? 0,
        originWeek: matched?.originWeek ?? currentFilename,
        lastCarriedFromWeek: matched?.lastCarriedFromWeek ?? currentFilename,
      })
    }
  }

  return results
}

export function upsertLineUnderHeading(
  content: string,
  targetHeading: string,
  line: string,
): string {
  const normalizedLine = line.trim()
  const sections = parseMarkdownSections(content)

  if (
    sections.some((section) =>
      section.lines.some((sectionLine) => sectionLine.trim() === normalizedLine),
    )
  ) {
    return content
  }

  const targetIndex = sections.findIndex((section) => section.heading === targetHeading)
  if (targetIndex >= 0) {
    sections[targetIndex].lines.push(line)
    return renderSections(sections)
  }

  const reorganizeIndex = sections.findIndex((section) => section.heading === 'Reorganize')
  if (reorganizeIndex >= 0) {
    sections[reorganizeIndex].lines.push(line)
    return renderSections(sections)
  }

  sections.push({ heading: 'Reorganize', lines: [line] })
  return renderSections(sections)
}

export function contentContainsMeaningfulText(content: string): boolean {
  return content
    .split(/\r?\n/)
    .some((line) => Boolean(line.trim()) && !/^[-*#]+$/.test(line.trim()))
}

function renderSections(sections: ParsedSection[]): string {
  return sections
    .map((section) => {
      const body = section.lines.join('\n').replace(/\n+$/, '')
      if (section.heading === null) {
        return body
      }
      return body ? `# ${section.heading}\n${body}` : `# ${section.heading}`
    })
    .join('\n\n')
    .trimEnd()
}
