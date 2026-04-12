export type BrainRoTStatus = 'active' | 'archived'
export type ThemePreference = 'light' | 'dark' | 'system'
export type StaleStyle = 'highlight' | 'red'
export type PaneKey = 'left' | 'right'

export interface CarryLineMeta {
  text: string
  originWeek: string
  lastCarriedFromWeek: string
  carryCount: number
}

export interface BrainSheet {
  id: string
  filename: string
  weekStart: string
  weekEnd: string
  status: BrainRoTStatus
  leftBrain: string
  rightBrain: string
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  sourceWeekId: string | null
  carryForwardMeta: {
    left: CarryLineMeta[]
    right: CarryLineMeta[]
  }
}

export interface Settings {
  staleThreshold: number
  staleStyle: StaleStyle
  theme: ThemePreference
  keyboardShortcuts: {
    focusLeftPane: string
    focusRightPane: string
    reviewAndAdvance: string
    openSearch: string
  }
}

export interface Templates {
  left: string
  right: string
}

export interface PersistWeekInput {
  id: string
  leftBrain: string
  rightBrain: string
}

export interface TemplatesSaveInput {
  left: string
  right: string
}

export interface ArchiveSearchResult {
  filename: string
  weekStart: string
  weekLabel: string
  snippet: string
}

export interface ExportResult {
  canceled: boolean
  filePath?: string
}

export interface SelectableCarryLine {
  id: string
  pane: PaneKey
  text: string
  heading: string | null
  carryCount: number
  originWeek: string
  lastCarriedFromWeek: string
}

export interface ReviewSelection {
  sourceId: string
  targetPane: PaneKey
  text: string
}

export interface ReviewPayload {
  currentWeek: BrainSheet
  nextWeek: BrainSheet
  selectableLines: SelectableCarryLine[]
}

export interface AppBootstrap {
  currentWeek: BrainSheet
  settings: Settings
  templates: Templates
}

export interface BrainRoTApi {
  bootstrap: () => Promise<AppBootstrap>
  saveWeek: (input: PersistWeekInput) => Promise<BrainSheet>
  forceReloadCurrentWeek: () => Promise<BrainSheet>
  getTemplates: () => Promise<Templates>
  saveTemplates: (input: TemplatesSaveInput) => Promise<{
    templates: Templates
    currentWeek: BrainSheet
  }>
  searchArchive: (query: string) => Promise<ArchiveSearchResult[]>
  openArchivedWeek: (filename: string) => Promise<BrainSheet>
  exportArchivedMarkdown: (filename: string) => Promise<ExportResult>
  getSettings: () => Promise<Settings>
  saveSettings: (input: Settings) => Promise<Settings>
  openReview: () => Promise<ReviewPayload>
  reviewAndAdvance: (input: {
    currentWeekId: string
    selections: ReviewSelection[]
  }) => Promise<BrainSheet>
}
