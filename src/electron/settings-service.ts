import { DEFAULT_SETTINGS } from '../shared/constants.js'
import type { Settings } from '../shared/types.js'
import { dirname } from 'node:path'
import { ensureDir, pathExists, readJsonFile, writeJsonFile } from './storage.js'

export async function loadSettings(path: string): Promise<Settings> {
  await ensureDir(dirname(path))
  if (!(await pathExists(path))) {
    await writeJsonFile(path, DEFAULT_SETTINGS)
    return DEFAULT_SETTINGS
  }

  const existing = await readJsonFile<Partial<Settings>>(path)
  return {
    ...DEFAULT_SETTINGS,
    ...existing,
    keyboardShortcuts: {
      ...DEFAULT_SETTINGS.keyboardShortcuts,
      ...existing.keyboardShortcuts,
    },
  }
}

export async function saveSettings(path: string, settings: Settings): Promise<Settings> {
  await writeJsonFile(path, settings)
  return settings
}
