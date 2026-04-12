import { app } from 'electron'
import { join } from 'node:path'
import {
  APP_FOLDER_NAME,
  LEFT_TEMPLATE_FILE,
  RIGHT_TEMPLATE_FILE,
  SETTINGS_FILE,
} from '../shared/constants.js'

export function getStoragePaths() {
  const root = join(app.getPath('userData'), APP_FOLDER_NAME)
  const activeDir = join(root, 'active')
  const archiveDir = join(root, 'archive')
  const templatesDir = join(root, 'templates')

  return {
    root,
    activeDir,
    archiveDir,
    templatesDir,
    settingsFile: join(root, SETTINGS_FILE),
    leftTemplateFile: join(templatesDir, LEFT_TEMPLATE_FILE),
    rightTemplateFile: join(templatesDir, RIGHT_TEMPLATE_FILE),
  }
}
