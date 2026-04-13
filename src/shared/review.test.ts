import { describe, expect, it } from 'vitest'
import { applySelectionsToWeek, buildReviewPayload } from './review.js'
import type { BrainSheet, ReviewSelection } from './types.js'

function makeSheet(overrides: Partial<BrainSheet> = {}): BrainSheet {
  return {
    id: 'test-id',
    filename: '260412_Brain_Sheet',
    weekStart: '2026-04-12',
    weekEnd: '2026-04-18',
    status: 'active',
    leftBrain: '',
    rightBrain: '',
    createdAt: '2026-04-12T00:00:00.000Z',
    updatedAt: '2026-04-12T00:00:00.000Z',
    archivedAt: null,
    sourceWeekId: null,
    carryForwardMeta: { left: [], right: [] },
    ...overrides,
  }
}

describe('buildReviewPayload', () => {
  it('returns currentWeek and nextWeek references unchanged', () => {
    const current = makeSheet()
    const next = makeSheet({ filename: '260419_Brain_Sheet', weekStart: '2026-04-19' })
    const payload = buildReviewPayload(current, next)
    expect(payload.currentWeek).toBe(current)
    expect(payload.nextWeek).toBe(next)
  })

  it('produces selectable lines from both panes', () => {
    const current = makeSheet({
      leftBrain: '# Priorities\n- left item',
      rightBrain: '# Ideas\n- right item',
    })
    const next = makeSheet({ filename: '260419_Brain_Sheet' })
    const payload = buildReviewPayload(current, next)

    const texts = payload.selectableLines.map((l) => l.text)
    expect(texts).toContain('- left item')
    expect(texts).toContain('- right item')
  })

  it('labels each line with the correct pane', () => {
    const current = makeSheet({
      leftBrain: '# Priorities\n- left item',
      rightBrain: '# Ideas\n- right item',
    })
    const payload = buildReviewPayload(current, makeSheet())
    const leftLine = payload.selectableLines.find((l) => l.text === '- left item')
    const rightLine = payload.selectableLines.find((l) => l.text === '- right item')
    expect(leftLine?.pane).toBe('left')
    expect(rightLine?.pane).toBe('right')
  })

  it('returns no selectable lines when both panes are empty', () => {
    const payload = buildReviewPayload(makeSheet(), makeSheet())
    expect(payload.selectableLines).toHaveLength(0)
  })

  it('carries the carryCount from existing meta onto the selectable line', () => {
    const current = makeSheet({
      leftBrain: '# Priorities\n- repeated',
      carryForwardMeta: {
        left: [
          {
            text: '- repeated',
            originWeek: '260405_Brain_Sheet',
            lastCarriedFromWeek: '260405_Brain_Sheet',
            carryCount: 2,
          },
        ],
        right: [],
      },
    })
    const payload = buildReviewPayload(current, makeSheet())
    const line = payload.selectableLines.find((l) => l.text === '- repeated')
    expect(line?.carryCount).toBe(2)
  })
})

describe('applySelectionsToWeek', () => {
  it('inserts the selected line into the destination pane', () => {
    const current = makeSheet({ leftBrain: '# Priorities\n- carry this\n- skip this' })
    const next = makeSheet({
      filename: '260419_Brain_Sheet',
      weekStart: '2026-04-19',
      leftBrain: '# Priorities\n- ',
    })
    const payload = buildReviewPayload(current, next)
    const lineToCarry = payload.selectableLines.find((l) => l.text === '- carry this')!

    const selections: ReviewSelection[] = [
      { sourceId: lineToCarry.id, targetPane: 'left', text: '- carry this' },
    ]
    const result = applySelectionsToWeek(payload, next, selections)

    expect(result.leftBrain).toContain('- carry this')
    expect(result.leftBrain).not.toContain('- skip this')
  })

  it('can redirect a line to a different pane', () => {
    const current = makeSheet({ leftBrain: '# Priorities\n- move to right' })
    const next = makeSheet({
      filename: '260419_Brain_Sheet',
      leftBrain: '# Priorities\n- ',
      rightBrain: '# Ideas\n- ',
    })
    const payload = buildReviewPayload(current, next)
    const line = payload.selectableLines.find((l) => l.text === '- move to right')!

    const result = applySelectionsToWeek(payload, next, [
      { sourceId: line.id, targetPane: 'right', text: '- move to right' },
    ])

    expect(result.rightBrain).toContain('- move to right')
    expect(result.leftBrain).not.toContain('- move to right')
  })

  it('sets carryCount to 1 for a first-time carry', () => {
    const current = makeSheet({ leftBrain: '# Priorities\n- fresh item' })
    const next = makeSheet({ filename: '260419_Brain_Sheet', leftBrain: '# Priorities\n- ' })
    const payload = buildReviewPayload(current, next)
    const line = payload.selectableLines.find((l) => l.text === '- fresh item')!

    const result = applySelectionsToWeek(payload, next, [
      { sourceId: line.id, targetPane: 'left', text: '- fresh item' },
    ])

    expect(result.carryForwardMeta.left[0].carryCount).toBe(1)
  })

  it('increments carryCount for previously carried items', () => {
    const current = makeSheet({
      leftBrain: '# Priorities\n- repeated',
      carryForwardMeta: {
        left: [
          {
            text: '- repeated',
            originWeek: '260405_Brain_Sheet',
            lastCarriedFromWeek: '260405_Brain_Sheet',
            carryCount: 1,
          },
        ],
        right: [],
      },
    })
    const next = makeSheet({ filename: '260419_Brain_Sheet', leftBrain: '# Priorities\n- ' })
    const payload = buildReviewPayload(current, next)
    const line = payload.selectableLines.find((l) => l.text === '- repeated')!

    const result = applySelectionsToWeek(payload, next, [
      { sourceId: line.id, targetPane: 'left', text: '- repeated' },
    ])

    expect(result.carryForwardMeta.left[0].carryCount).toBe(2)
  })

  it('does not duplicate a line already present in the destination', () => {
    const current = makeSheet({ leftBrain: '# Priorities\n- existing line' })
    const next = makeSheet({
      filename: '260419_Brain_Sheet',
      leftBrain: '# Priorities\n- existing line',
    })
    const payload = buildReviewPayload(current, next)
    const line = payload.selectableLines.find((l) => l.text === '- existing line')!

    const result = applySelectionsToWeek(payload, next, [
      { sourceId: line.id, targetPane: 'left', text: '- existing line' },
    ])

    const count = (result.leftBrain.match(/- existing line/g) ?? []).length
    expect(count).toBe(1)
  })

  it('returns destination week unchanged when selections is empty', () => {
    const current = makeSheet({ leftBrain: '# Priorities\n- item' })
    const next = makeSheet({
      filename: '260419_Brain_Sheet',
      leftBrain: '# Priorities\n- ',
      rightBrain: '# Ideas\n- ',
    })
    const payload = buildReviewPayload(current, next)
    const result = applySelectionsToWeek(payload, next, [])

    expect(result.leftBrain).toBe(next.leftBrain)
    expect(result.rightBrain).toBe(next.rightBrain)
  })

  it('allows the carried text to be edited before confirming', () => {
    const current = makeSheet({ leftBrain: '# Priorities\n- original text' })
    const next = makeSheet({ filename: '260419_Brain_Sheet', leftBrain: '# Priorities\n- ' })
    const payload = buildReviewPayload(current, next)
    const line = payload.selectableLines.find((l) => l.text === '- original text')!

    const result = applySelectionsToWeek(payload, next, [
      { sourceId: line.id, targetPane: 'left', text: '- edited text' },
    ])

    expect(result.leftBrain).toContain('- edited text')
    expect(result.leftBrain).not.toContain('- original text')
  })
})
