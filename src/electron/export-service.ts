import { BrowserWindow, dialog } from 'electron'
import type { BrainSheet, ExportResult } from '../shared/types.js'
import { atomicWriteFile } from './storage.js'

export async function exportArchivedWeekToMarkdown(
  window: BrowserWindow,
  week: BrainSheet,
): Promise<ExportResult> {
  const result = await dialog.showSaveDialog(window, {
    defaultPath: `${week.filename}.md`,
    filters: [{ name: 'Markdown', extensions: ['md'] }],
  })

  if (result.canceled || !result.filePath) {
    return { canceled: true }
  }

  const markdown = `# ${week.filename}
Week start: ${week.weekStart}
Week end: ${week.weekEnd}

## Left Brain
${week.leftBrain}

## Right Brain
${week.rightBrain}
`

  await atomicWriteFile(result.filePath, markdown)

  return {
    canceled: false,
    filePath: result.filePath,
  }
}
