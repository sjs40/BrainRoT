import { randomUUID } from 'node:crypto'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { applySelectionsToWeek, buildReviewPayload } from '../shared/review.js'
import { computeWeekRange } from '../shared/week.js'
import {
  endOfWeekSaturday,
  formatDateIso,
  nextWeekSunday,
  weekFilename,
  weekLabel,
} from '../shared/week.js'
import type {
  ArchiveSearchResult,
  BrainSheet,
  ReviewPayload,
  ReviewSelection,
  Templates,
} from '../shared/types.js'
import { ensureDir, pathExists, readJsonFile, removeIfExists, writeJsonFile } from './storage.js'

export interface WeekPaths {
  activeDir: string
  archiveDir: string
}

export async function ensureCurrentWeek(
  paths: WeekPaths,
  templates: Templates,
): Promise<BrainSheet> {
  await ensureDir(paths.activeDir)
  await ensureDir(paths.archiveDir)

  const { weekStart, weekEnd, filename } = computeWeekRange()
  const filePath = getWeekPath(paths.activeDir, filename)

  if (await pathExists(filePath)) {
    return readJsonFile<BrainSheet>(filePath)
  }

  const now = new Date().toISOString()
  const week: BrainSheet = {
    id: randomUUID(),
    filename,
    weekStart,
    weekEnd,
    status: 'active',
    leftBrain: templates.left,
    rightBrain: templates.right,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    sourceWeekId: null,
    carryForwardMeta: {
      left: [],
      right: [],
    },
  }

  await writeJsonFile(filePath, week)
  return week
}

export async function loadActiveWeekById(activeDir: string, weekId: string): Promise<BrainSheet> {
  const path = await findWeekFileById(activeDir, weekId)
  if (!path) {
    throw new Error('Active week not found.')
  }
  return readJsonFile<BrainSheet>(path)
}

export async function saveActiveWeek(
  activeDir: string,
  input: Pick<BrainSheet, 'id' | 'leftBrain' | 'rightBrain'>,
): Promise<BrainSheet> {
  const path = await findWeekFileById(activeDir, input.id)
  if (!path) {
    throw new Error('Active week not found.')
  }

  const existing = await readJsonFile<BrainSheet>(path)
  const updated: BrainSheet = {
    ...existing,
    leftBrain: input.leftBrain,
    rightBrain: input.rightBrain,
    updatedAt: new Date().toISOString(),
  }

  await writeJsonFile(path, updated)
  return updated
}

export async function openReviewPayload(
  paths: WeekPaths,
  currentWeek: BrainSheet,
  templates: Templates,
): Promise<ReviewPayload> {
  const nextWeek = await loadOrBuildNextWeek(paths.activeDir, currentWeek, templates)
  return buildReviewPayload(currentWeek, nextWeek)
}

export async function reviewAndAdvance(
  paths: WeekPaths,
  currentWeek: BrainSheet,
  selections: ReviewSelection[],
  templates: Templates,
): Promise<BrainSheet> {
  const nextWeekPathInfo = getNextWeekIdentity(paths.activeDir, currentWeek)
  const nextWeek = await loadOrBuildNextWeek(paths.activeDir, currentWeek, templates)
  const payload = buildReviewPayload(currentWeek, nextWeek)
  const mergedNextWeek = applySelectionsToWeek(payload, nextWeek, selections)

  await writeJsonFile(nextWeekPathInfo.path, mergedNextWeek)

  const currentPath = await findWeekFileById(paths.activeDir, currentWeek.id)
  if (!currentPath) {
    throw new Error('Current active week not found.')
  }

  const archivedWeek: BrainSheet = {
    ...currentWeek,
    status: 'archived',
    archivedAt: new Date().toISOString(),
  }
  await writeJsonFile(getWeekPath(paths.archiveDir, currentWeek.filename), archivedWeek)
  await removeIfExists(currentPath)

  return mergedNextWeek
}

export async function searchArchivedWeeks(
  archiveDir: string,
  query: string,
): Promise<ArchiveSearchResult[]> {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return []
  }

  const files = await readdir(archiveDir)
  const results: ArchiveSearchResult[] = []

  for (const file of files) {
    if (!file.endsWith('.json')) {
      continue
    }

    const week = await readJsonFile<BrainSheet>(join(archiveDir, file))
    const haystack = [week.filename, week.weekStart, week.leftBrain, week.rightBrain]
      .join('\n')
      .toLowerCase()

    if (!haystack.includes(normalized)) {
      continue
    }

    results.push({
      filename: week.filename,
      weekStart: week.weekStart,
      weekLabel: weekLabel(week.weekStart),
      snippet: buildSnippet(week, normalized),
    })
  }

  return results.sort((a, b) => b.weekStart.localeCompare(a.weekStart))
}

export async function loadArchivedWeek(
  archiveDir: string,
  filename: string,
): Promise<BrainSheet> {
  return readJsonFile<BrainSheet>(getWeekPath(archiveDir, filename))
}

async function loadOrBuildNextWeek(
  activeDir: string,
  currentWeek: BrainSheet,
  templates: Templates,
): Promise<BrainSheet> {
  const nextWeekInfo = getNextWeekIdentity(activeDir, currentWeek)
  if (await pathExists(nextWeekInfo.path)) {
    return readJsonFile<BrainSheet>(nextWeekInfo.path)
  }

  const now = new Date().toISOString()
  return {
    id: randomUUID(),
    filename: nextWeekInfo.filename,
    weekStart: nextWeekInfo.weekStart,
    weekEnd: nextWeekInfo.weekEnd,
    status: 'active',
    leftBrain: templates.left,
    rightBrain: templates.right,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    sourceWeekId: currentWeek.id,
    carryForwardMeta: {
      left: [],
      right: [],
    },
  }
}

function getNextWeekIdentity(activeDir: string, currentWeek: BrainSheet): {
  filename: string
  weekStart: string
  weekEnd: string
  path: string
} {
  const nextStartDate = nextWeekSunday(currentWeek.weekStart)
  const weekStart = formatDateIso(nextStartDate)
  const filename = weekFilename(weekStart)
  return {
    filename,
    weekStart,
    weekEnd: formatDateIso(endOfWeekSaturday(nextStartDate)),
    path: getWeekPath(activeDir, filename),
  }
}

async function findWeekFileById(directory: string, weekId: string): Promise<string | null> {
  const files = await readdir(directory)
  for (const file of files) {
    if (!file.endsWith('.json')) {
      continue
    }

    const path = join(directory, file)
    const week = await readJsonFile<BrainSheet>(path)
    if (week.id === weekId) {
      return path
    }
  }

  return null
}

function getWeekPath(directory: string, filename: string): string {
  return join(directory, `${filename}.json`)
}

function buildSnippet(week: BrainSheet, query: string): string {
  const source = `${week.leftBrain}\n${week.rightBrain}`
  const lowered = source.toLowerCase()
  const index = lowered.indexOf(query)
  if (index === -1) {
    return week.filename
  }

  const start = Math.max(0, index - 60)
  const end = Math.min(source.length, index + query.length + 60)
  return source.slice(start, end).replace(/\s+/g, ' ').trim()
}
