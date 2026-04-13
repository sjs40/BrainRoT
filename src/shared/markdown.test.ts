import { describe, expect, it } from 'vitest'
import {
  contentContainsMeaningfulText,
  parseMarkdownSections,
  upsertLineUnderHeading,
} from './markdown.js'

describe('parseMarkdownSections', () => {
  it('parses sections separated by h1 headings', () => {
    const content = '# Section One\n- item a\n- item b\n\n# Section Two\n- item c'
    const sections = parseMarkdownSections(content)
    expect(sections).toHaveLength(2)
    expect(sections[0].heading).toBe('Section One')
    expect(sections[0].lines).toContain('- item a')
    expect(sections[0].lines).toContain('- item b')
    expect(sections[1].heading).toBe('Section Two')
    expect(sections[1].lines).toContain('- item c')
  })

  it('captures content before the first heading as a null-heading section', () => {
    const content = 'preamble\n\n# Section One\n- item a'
    const sections = parseMarkdownSections(content)
    expect(sections[0].heading).toBeNull()
    expect(sections[0].lines).toContain('preamble')
    expect(sections[1].heading).toBe('Section One')
  })

  it('returns a single null-heading section with one empty line for an empty string', () => {
    const sections = parseMarkdownSections('')
    expect(sections).toHaveLength(1)
    expect(sections[0].heading).toBeNull()
    expect(sections[0].lines).toHaveLength(1)
    expect(sections[0].lines[0]).toBe('')
  })

  it('treats content with no headings as a single null-heading section', () => {
    const sections = parseMarkdownSections('line one\nline two')
    expect(sections).toHaveLength(1)
    expect(sections[0].heading).toBeNull()
    expect(sections[0].lines).toContain('line one')
  })

  it('handles deeper heading levels (h2–h6)', () => {
    const content = '## Deep\n- item'
    const sections = parseMarkdownSections(content)
    expect(sections[0].heading).toBe('Deep')
  })

  it('preserves blank lines inside sections', () => {
    const content = '# Section\n- a\n\n- b'
    const sections = parseMarkdownSections(content)
    expect(sections[0].lines).toContain('')
  })
})

describe('upsertLineUnderHeading', () => {
  const base = '# Priorities\n- existing\n\n# Ideas\n- another'

  it('adds a new line under an existing heading', () => {
    const result = upsertLineUnderHeading(base, 'Priorities', '- new item')
    expect(result).toContain('- new item')
    const prioritiesIdx = result.indexOf('# Priorities')
    const ideasIdx = result.indexOf('# Ideas')
    const newItemIdx = result.indexOf('- new item')
    expect(newItemIdx).toBeGreaterThan(prioritiesIdx)
    expect(newItemIdx).toBeLessThan(ideasIdx)
  })

  it('does not add a duplicate line', () => {
    const result = upsertLineUnderHeading(base, 'Priorities', '- existing')
    const count = (result.match(/- existing/g) ?? []).length
    expect(count).toBe(1)
  })

  it('creates a Reorganize section when the target heading is not found', () => {
    const result = upsertLineUnderHeading(base, 'NonExistent', '- orphan')
    expect(result).toContain('# Reorganize')
    expect(result).toContain('- orphan')
  })

  it('appends to an existing Reorganize section rather than creating a second one', () => {
    const withReorg = '# Priorities\n- existing\n\n# Reorganize\n- first orphan'
    const result = upsertLineUnderHeading(withReorg, 'Missing', '- second orphan')
    expect((result.match(/# Reorganize/g) ?? []).length).toBe(1)
    expect(result).toContain('- second orphan')
  })

  it('deduplicates by trimmed value (ignores leading/trailing whitespace)', () => {
    const result = upsertLineUnderHeading(base, 'Priorities', '  - existing  ')
    const count = (result.match(/- existing/g) ?? []).length
    expect(count).toBe(1)
  })
})

describe('contentContainsMeaningfulText', () => {
  it('returns false for an empty string', () => {
    expect(contentContainsMeaningfulText('')).toBe(false)
  })

  it('returns false for lines that are only dashes', () => {
    expect(contentContainsMeaningfulText('- \n- \n-')).toBe(false)
  })

  it('returns false for lines that are only hashes', () => {
    expect(contentContainsMeaningfulText('#\n##')).toBe(false)
  })

  it('returns false for blank lines only', () => {
    expect(contentContainsMeaningfulText('\n\n\n')).toBe(false)
  })

  it('returns true for a line with real text', () => {
    expect(contentContainsMeaningfulText('- actual content')).toBe(true)
  })

  it('returns true even when mixed with empty lines', () => {
    expect(contentContainsMeaningfulText('\n\n- real item\n\n')).toBe(true)
  })

  it('returns true for a heading with text (not just #)', () => {
    expect(contentContainsMeaningfulText('# My Heading')).toBe(true)
  })
})
