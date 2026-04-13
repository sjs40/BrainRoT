import { describe, expect, it } from 'vitest'
import type { CarryLineMeta } from '@shared/types'
import { getLineDecorations, renderSaveState } from './utils.js'

describe('renderSaveState', () => {
  it('returns "Saving..." when saving', () => {
    expect(renderSaveState('saving')).toBe('Saving...')
  })

  it('returns "Unsaved" when dirty', () => {
    expect(renderSaveState('dirty')).toBe('Unsaved')
  })

  it('returns "Saved" when saved', () => {
    expect(renderSaveState('saved')).toBe('Saved')
  })
})

describe('getLineDecorations', () => {
  const carriedMeta: CarryLineMeta[] = [
    {
      text: '- carried item',
      originWeek: '260405_Brain_Sheet',
      lastCarriedFromWeek: '260405_Brain_Sheet',
      carryCount: 2,
    },
  ]

  it('returns null meta for lines not present in carryMeta', () => {
    const decorations = getLineDecorations('- fresh\n- another', [], 3)
    expect(decorations[0].meta).toBeNull()
    expect(decorations[1].meta).toBeNull()
  })

  it('returns carry meta for a line that matches a carryMeta entry', () => {
    const decorations = getLineDecorations('- carried item', carriedMeta, 3)
    expect(decorations[0].meta).not.toBeNull()
    expect(decorations[0].meta?.carryCount).toBe(2)
  })

  it('marks a line as stale when carryCount equals the threshold', () => {
    const decorations = getLineDecorations('- carried item', carriedMeta, 2)
    expect(decorations[0].meta?.isStale).toBe(true)
  })

  it('marks a line as stale when carryCount exceeds the threshold', () => {
    const decorations = getLineDecorations('- carried item', carriedMeta, 1)
    expect(decorations[0].meta?.isStale).toBe(true)
  })

  it('does not mark a line as stale when carryCount is below the threshold', () => {
    const decorations = getLineDecorations('- carried item', carriedMeta, 3)
    expect(decorations[0].meta?.isStale).toBe(false)
  })

  it('returns null meta for blank lines even when carryMeta is non-empty', () => {
    const decorations = getLineDecorations('\n', carriedMeta, 3)
    expect(decorations[0].meta).toBeNull()
  })

  it('preserves the original line text in the decoration', () => {
    const decorations = getLineDecorations('  - carried item  ', carriedMeta, 3)
    expect(decorations[0].text).toBe('  - carried item  ')
  })

  it('matches by trimmed text, ignoring surrounding whitespace', () => {
    const decorations = getLineDecorations('  - carried item  ', carriedMeta, 3)
    expect(decorations[0].meta).not.toBeNull()
  })

  it('produces one decoration entry per line', () => {
    const content = 'line one\nline two\nline three'
    const decorations = getLineDecorations(content, [], 3)
    expect(decorations).toHaveLength(3)
  })

  it('consumes each meta entry only once (no double-matching)', () => {
    const meta: CarryLineMeta[] = [
      {
        text: '- item',
        originWeek: '260405_Brain_Sheet',
        lastCarriedFromWeek: '260405_Brain_Sheet',
        carryCount: 1,
      },
    ]
    const decorations = getLineDecorations('- item\n- item', meta, 3)
    const withMeta = decorations.filter((d) => d.meta !== null)
    expect(withMeta).toHaveLength(1)
  })
})
