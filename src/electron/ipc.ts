import { BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import type {
  AppBootstrap,
  PersistWeekInput,
  ReviewSelection,
  Settings,
  TemplatesSaveInput,
} from '../shared/types.js'
import { exportArchivedWeekToMarkdown } from './export-service.js'
import { getStoragePaths } from './paths.js'
import { loadSettings, saveSettings } from './settings-service.js'
import { loadTemplates, saveTemplates } from './template-service.js'
import { writeJsonFile } from './storage.js'
import {
  ensureCurrentWeek,
  loadActiveWeekById,
  loadArchivedWeek,
  openReviewPayload,
  reviewAndAdvance,
  saveActiveWeek,
  searchArchivedWeeks,
} from './week-service.js'

let handlersRegistered = false

export function registerIpcHandlers(window: BrowserWindow): void {
  if (handlersRegistered) {
    return
  }
  handlersRegistered = true

  ipcMain.handle('brainrot:bootstrap', async (): Promise<AppBootstrap> => {
    const paths = getStoragePaths()
    const settings = await loadSettings(paths.settingsFile)
    const templates = await loadTemplates(
      paths.leftTemplateFile,
      paths.rightTemplateFile,
    )
    const currentWeek = await ensureCurrentWeek(
      {
        activeDir: paths.activeDir,
        archiveDir: paths.archiveDir,
      },
      templates,
    )

    return {
      currentWeek,
      settings,
      templates,
    }
  })

  ipcMain.handle('brainrot:save-week', async (_event, input: PersistWeekInput) => {
    const paths = getStoragePaths()
    return saveActiveWeek(paths.activeDir, input)
  })

  ipcMain.handle('brainrot:force-reload-current-week', async () => {
    const paths = getStoragePaths()
    const templates = await loadTemplates(
      paths.leftTemplateFile,
      paths.rightTemplateFile,
    )
    return ensureCurrentWeek(
      {
        activeDir: paths.activeDir,
        archiveDir: paths.archiveDir,
      },
      templates,
    )
  })

  ipcMain.handle('brainrot:get-templates', async () => {
    const paths = getStoragePaths()
    return loadTemplates(paths.leftTemplateFile, paths.rightTemplateFile)
  })

  ipcMain.handle(
    'brainrot:save-templates',
    async (_event, input: TemplatesSaveInput) => {
      const paths = getStoragePaths()
      const currentTemplates = await loadTemplates(
        paths.leftTemplateFile,
        paths.rightTemplateFile,
      )
      const currentWeek = await ensureCurrentWeek(
        {
          activeDir: paths.activeDir,
          archiveDir: paths.archiveDir,
        },
        currentTemplates,
      )

      const result = await saveTemplates(
        paths.leftTemplateFile,
        paths.rightTemplateFile,
        input,
        currentTemplates,
        currentWeek,
      )

      await writeJsonFile(
        join(paths.activeDir, `${result.currentWeek.filename}.json`),
        result.currentWeek,
      )

      return result
    },
  )

  ipcMain.handle('brainrot:search-archive', async (_event, query: string) => {
    const paths = getStoragePaths()
    return searchArchivedWeeks(paths.archiveDir, query)
  })

  ipcMain.handle('brainrot:open-archived-week', async (_event, filename: string) => {
    const paths = getStoragePaths()
    return loadArchivedWeek(paths.archiveDir, filename)
  })

  ipcMain.handle(
    'brainrot:export-archived-markdown',
    async (_event, filename: string) => {
      const paths = getStoragePaths()
      const week = await loadArchivedWeek(paths.archiveDir, filename)
      return exportArchivedWeekToMarkdown(window, week)
    },
  )

  ipcMain.handle('brainrot:get-settings', async () => {
    const paths = getStoragePaths()
    return loadSettings(paths.settingsFile)
  })

  ipcMain.handle('brainrot:save-settings', async (_event, input: Settings) => {
    const paths = getStoragePaths()
    return saveSettings(paths.settingsFile, input)
  })

  ipcMain.handle('brainrot:open-review', async () => {
    const paths = getStoragePaths()
    const templates = await loadTemplates(
      paths.leftTemplateFile,
      paths.rightTemplateFile,
    )
    const currentWeek = await ensureCurrentWeek(
      {
        activeDir: paths.activeDir,
        archiveDir: paths.archiveDir,
      },
      templates,
    )

    return openReviewPayload(
      {
        activeDir: paths.activeDir,
        archiveDir: paths.archiveDir,
      },
      currentWeek,
      templates,
    )
  })

  ipcMain.handle(
    'brainrot:review-and-advance',
    async (
      _event,
      input: { currentWeekId: string; selections: ReviewSelection[] },
    ) => {
      const paths = getStoragePaths()
      const currentWeek = await loadActiveWeekById(paths.activeDir, input.currentWeekId)
      const templates = await loadTemplates(
        paths.leftTemplateFile,
        paths.rightTemplateFile,
      )

      return reviewAndAdvance(
        {
          activeDir: paths.activeDir,
          archiveDir: paths.archiveDir,
        },
        currentWeek,
        input.selections,
        templates,
      )
    },
  )
}
