import { readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { DEFAULT_TEMPLATES } from '../shared/constants.js'
import { contentContainsMeaningfulText } from '../shared/markdown.js'
import type { BrainSheet, Templates } from '../shared/types.js'
import { atomicWriteFile, ensureDir, pathExists } from './storage.js'

export async function loadTemplates(
  leftTemplatePath: string,
  rightTemplatePath: string,
): Promise<Templates> {
  await ensureDir(dirname(leftTemplatePath))
  await ensureDir(dirname(rightTemplatePath))
  if (!(await pathExists(leftTemplatePath))) {
    await atomicWriteFile(leftTemplatePath, DEFAULT_TEMPLATES.left)
  }

  if (!(await pathExists(rightTemplatePath))) {
    await atomicWriteFile(rightTemplatePath, DEFAULT_TEMPLATES.right)
  }

  return {
    left: await readFile(leftTemplatePath, 'utf8'),
    right: await readFile(rightTemplatePath, 'utf8'),
  }
}

export async function saveTemplates(
  leftTemplatePath: string,
  rightTemplatePath: string,
  nextTemplates: Templates,
  currentTemplates: Templates,
  currentWeek: BrainSheet,
): Promise<{
  templates: Templates
  currentWeek: BrainSheet
}> {
  await atomicWriteFile(leftTemplatePath, nextTemplates.left)
  await atomicWriteFile(rightTemplatePath, nextTemplates.right)

  return {
    templates: nextTemplates,
    currentWeek: {
      ...currentWeek,
      leftBrain: applyTemplateToPane(
        currentWeek.leftBrain,
        currentTemplates.left,
        nextTemplates.left,
      ),
      rightBrain: applyTemplateToPane(
        currentWeek.rightBrain,
        currentTemplates.right,
        nextTemplates.right,
      ),
      updatedAt: new Date().toISOString(),
    },
  }
}

function applyTemplateToPane(
  currentContent: string,
  previousTemplate: string,
  nextTemplate: string,
): string {
  const normalizedCurrent = currentContent.trim()
  const normalizedPrevious = previousTemplate.trim()

  if (!normalizedCurrent || normalizedCurrent === normalizedPrevious) {
    return nextTemplate
  }

  if (!contentContainsMeaningfulText(currentContent)) {
    return nextTemplate
  }

  return `${nextTemplate.trimEnd()}

# Reorganize to new template
${currentContent.trimStart()}`
}
