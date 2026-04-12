import { constants as fsConstants } from 'node:fs'
import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true })
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, fsConstants.F_OK)
    return true
  } catch {
    return false
  }
}

export async function atomicWriteFile(path: string, contents: string): Promise<void> {
  const tempPath = `${path}.tmp`
  await writeFile(tempPath, contents, 'utf8')
  await rm(path, { force: true })
  await rename(tempPath, path)
}

export async function readJsonFile<T>(path: string): Promise<T> {
  const raw = await readFile(path, 'utf8')
  return JSON.parse(raw) as T
}

export async function writeJsonFile(path: string, value: unknown): Promise<void> {
  await atomicWriteFile(path, JSON.stringify(value, null, 2))
}

export async function removeIfExists(path: string): Promise<void> {
  if (await pathExists(path)) {
    await rm(path, { force: true })
  }
}
