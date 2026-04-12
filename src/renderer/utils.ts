import type { BrainSheet, Settings } from '@shared/types'

export interface LineDecoration {
  text: string
  meta: null | {
    carryCount: number
    isStale: boolean
  }
}

export function getLineDecorations(
  content: string,
  carryMeta: BrainSheet['carryForwardMeta']['left'],
  staleThreshold: number,
): LineDecoration[] {
  const metaPool = [...carryMeta]

  return content.split(/\r?\n/).map((line) => {
    const normalized = line.trim()
    if (!normalized) {
      return { text: line, meta: null }
    }

    const index = metaPool.findIndex((entry) => entry.text === normalized)
    if (index === -1) {
      return { text: line, meta: null }
    }

    const meta = metaPool.splice(index, 1)[0]
    return {
      text: line,
      meta: {
        carryCount: meta.carryCount,
        isStale: meta.carryCount >= staleThreshold,
      },
    }
  })
}

export function renderSaveState(saveState: 'saved' | 'saving' | 'dirty'): string {
  if (saveState === 'saving') {
    return 'Saving...'
  }

  if (saveState === 'dirty') {
    return 'Unsaved'
  }

  return 'Saved'
}

export function formatTimestamp(value: string | null): string {
  if (!value) {
    return 'n/a'
  }
  return new Date(value).toLocaleString()
}

export function applyTheme(theme: Settings['theme']): void {
  document.documentElement.dataset.theme = theme
}
