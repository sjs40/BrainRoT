import { selectableLinesFromPane, upsertLineUnderHeading } from './markdown.js'
import type {
  BrainSheet,
  CarryLineMeta,
  ReviewPayload,
  ReviewSelection,
} from './types.js'

export function buildReviewPayload(
  currentWeek: BrainSheet,
  nextWeek: BrainSheet,
): ReviewPayload {
  return {
    currentWeek,
    nextWeek,
    selectableLines: [
      ...selectableLinesFromPane(
        'left',
        currentWeek.leftBrain,
        currentWeek.carryForwardMeta.left,
        currentWeek.filename,
      ),
      ...selectableLinesFromPane(
        'right',
        currentWeek.rightBrain,
        currentWeek.carryForwardMeta.right,
        currentWeek.filename,
      ),
    ],
  }
}

export function applySelectionsToWeek(
  payload: ReviewPayload,
  destinationWeek: BrainSheet,
  selections: ReviewSelection[],
): BrainSheet {
  const lineById = new Map(payload.selectableLines.map((line) => [line.id, line]))
  const nextLeftMeta = [...destinationWeek.carryForwardMeta.left]
  const nextRightMeta = [...destinationWeek.carryForwardMeta.right]
  let leftBrain = destinationWeek.leftBrain
  let rightBrain = destinationWeek.rightBrain

  for (const selection of selections) {
    const source = lineById.get(selection.sourceId)
    const nextText = selection.text.trim()
    if (!source || !nextText) {
      continue
    }

    const nextMetaEntry: CarryLineMeta = {
      text: nextText,
      originWeek: source.originWeek,
      lastCarriedFromWeek: payload.currentWeek.filename,
      carryCount: source.carryCount > 0 ? source.carryCount + 1 : 1,
    }
    const targetHeading = source.heading ?? 'Reorganize'

    if (selection.targetPane === 'left') {
      leftBrain = upsertLineUnderHeading(leftBrain, targetHeading, nextText)
      mergeMeta(nextLeftMeta, nextMetaEntry)
    } else {
      rightBrain = upsertLineUnderHeading(rightBrain, targetHeading, nextText)
      mergeMeta(nextRightMeta, nextMetaEntry)
    }
  }

  return {
    ...destinationWeek,
    leftBrain,
    rightBrain,
    updatedAt: new Date().toISOString(),
    carryForwardMeta: {
      left: nextLeftMeta,
      right: nextRightMeta,
    },
  }
}

function mergeMeta(entries: CarryLineMeta[], nextEntry: CarryLineMeta): void {
  const index = entries.findIndex((entry) => entry.text === nextEntry.text)
  if (index === -1) {
    entries.push(nextEntry)
    return
  }

  entries[index] = {
    ...entries[index],
    originWeek: entries[index].originWeek || nextEntry.originWeek,
    lastCarriedFromWeek: nextEntry.lastCarriedFromWeek,
    carryCount: Math.max(entries[index].carryCount, nextEntry.carryCount),
  }
}
