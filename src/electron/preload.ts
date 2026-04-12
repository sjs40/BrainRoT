import { contextBridge, ipcRenderer } from 'electron'
import type {
  BrainRoTApi,
  PersistWeekInput,
  Settings,
  TemplatesSaveInput,
} from '../shared/types.js'

const api: BrainRoTApi = {
  bootstrap: () => ipcRenderer.invoke('brainrot:bootstrap'),
  saveWeek: (input: PersistWeekInput) => ipcRenderer.invoke('brainrot:save-week', input),
  forceReloadCurrentWeek: () => ipcRenderer.invoke('brainrot:force-reload-current-week'),
  getTemplates: () => ipcRenderer.invoke('brainrot:get-templates'),
  saveTemplates: (input: TemplatesSaveInput) =>
    ipcRenderer.invoke('brainrot:save-templates', input),
  searchArchive: (query: string) => ipcRenderer.invoke('brainrot:search-archive', query),
  openArchivedWeek: (filename: string) =>
    ipcRenderer.invoke('brainrot:open-archived-week', filename),
  exportArchivedMarkdown: (filename: string) =>
    ipcRenderer.invoke('brainrot:export-archived-markdown', filename),
  getSettings: () => ipcRenderer.invoke('brainrot:get-settings'),
  saveSettings: (input: Settings) => ipcRenderer.invoke('brainrot:save-settings', input),
  openReview: () => ipcRenderer.invoke('brainrot:open-review'),
  reviewAndAdvance: (input) => ipcRenderer.invoke('brainrot:review-and-advance', input),
}

contextBridge.exposeInMainWorld('brainrot', api)
