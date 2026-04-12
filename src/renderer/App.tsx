import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  ArchiveSearchResult,
  BrainSheet,
  ReviewPayload,
  ReviewSelection,
  Settings,
  Templates,
} from '@shared/types'
import { weekLabel } from '@shared/week'
import { PaneEditor } from './components/PaneEditor'
import { ReviewModal } from './components/ReviewModal'
import { SearchModal } from './components/SearchModal'
import { SettingsModal } from './components/SettingsModal'
import { applyTheme, formatTimestamp, getLineDecorations, renderSaveState } from './utils'

type SaveState = 'saved' | 'saving' | 'dirty'
type WorkspaceOverlay = 'none' | 'settings' | 'search'

export function App() {
  const [currentWeek, setCurrentWeek] = useState<BrainSheet | null>(null)
  const [leftDraft, setLeftDraft] = useState('')
  const [rightDraft, setRightDraft] = useState('')
  const [templates, setTemplates] = useState<Templates | null>(null)
  const [leftTemplateDraft, setLeftTemplateDraft] = useState('')
  const [rightTemplateDraft, setRightTemplateDraft] = useState('')
  const [settings, setSettings] = useState<Settings | null>(null)
  const [settingsDraft, setSettingsDraft] = useState<Settings | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [reviewPayload, setReviewPayload] = useState<ReviewPayload | null>(null)
  const [workspaceOverlay, setWorkspaceOverlay] = useState<WorkspaceOverlay>('none')
  const [archiveQuery, setArchiveQuery] = useState('')
  const [archiveResults, setArchiveResults] = useState<ArchiveSearchResult[]>([])
  const [archivedWeek, setArchivedWeek] = useState<BrainSheet | null>(null)
  const [searchExpanded, setSearchExpanded] = useState(false)
  const leftRef = useRef<HTMLTextAreaElement | null>(null)
  const rightRef = useRef<HTMLTextAreaElement | null>(null)
  const saveTimer = useRef<number | null>(null)

  useEffect(() => {
    void bootstrap()
  }, [])

  useEffect(() => {
    if (!currentWeek) {
      return
    }

    setLeftDraft(currentWeek.leftBrain)
    setRightDraft(currentWeek.rightBrain)
    setSaveState('saved')
  }, [currentWeek])

  useEffect(() => {
    if (settings) {
      setSettingsDraft(settings)
      applyTheme(settings.theme)
    }
  }, [settings])

  useEffect(() => {
    if (!templates) {
      return
    }

    setLeftTemplateDraft(templates.left)
    setRightTemplateDraft(templates.right)
  }, [templates])

  useEffect(() => {
    const onBeforeUnload = () => {
      if (saveState === 'dirty') {
        void flushSave()
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [saveState, leftDraft, rightDraft, currentWeek])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isMod = event.ctrlKey || event.metaKey

      if (isMod && event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault()
        leftRef.current?.focus()
        return
      }

      if (isMod && event.altKey && event.key === 'ArrowRight') {
        event.preventDefault()
        rightRef.current?.focus()
        return
      }

      if (event.altKey && event.key.toLowerCase() === 'r') {
        event.preventDefault()
        void openReview()
        return
      }

      if (event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setArchivedWeek(null)
        setWorkspaceOverlay('search')
        return
      }

      if (isMod && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void flushSave()
        return
      }

      if (isMod && event.key === ',') {
        event.preventDefault()
        setWorkspaceOverlay('settings')
        return
      }

      if (isMod && event.shiftKey && event.key.toLowerCase() === 't') {
        event.preventDefault()
        setWorkspaceOverlay('settings')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [currentWeek, leftDraft, rightDraft])

  const leftDecorations = useMemo(
    () =>
      getLineDecorations(
        leftDraft,
        currentWeek?.carryForwardMeta.left ?? [],
        settings?.staleThreshold ?? 3,
      ),
    [leftDraft, currentWeek, settings],
  )

  const rightDecorations = useMemo(
    () =>
      getLineDecorations(
        rightDraft,
        currentWeek?.carryForwardMeta.right ?? [],
        settings?.staleThreshold ?? 3,
      ),
    [rightDraft, currentWeek, settings],
  )

  async function bootstrap(): Promise<void> {
    const data = await window.brainrot.bootstrap()
    setCurrentWeek(data.currentWeek)
    setTemplates(data.templates)
    setSettings(data.settings)
  }

  function queueSave(nextLeft: string, nextRight: string): void {
    setSaveState('dirty')
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current)
    }

    saveTimer.current = window.setTimeout(() => {
      void saveWeek(nextLeft, nextRight)
    }, 1200)
  }

  async function saveWeek(nextLeft = leftDraft, nextRight = rightDraft): Promise<void> {
    if (!currentWeek) {
      return
    }

    setSaveState('saving')
    const saved = await window.brainrot.saveWeek({
      id: currentWeek.id,
      leftBrain: nextLeft,
      rightBrain: nextRight,
    })
    setCurrentWeek(saved)
    setSaveState('saved')
  }

  async function flushSave(): Promise<void> {
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    await saveWeek()
  }

  async function openReview(): Promise<void> {
    await flushSave()
    const payload = await window.brainrot.openReview()
    setReviewPayload(payload)
  }

  async function handleReviewAdvance(selections: ReviewSelection[]): Promise<void> {
    if (!reviewPayload) {
      return
    }

    const nextWeek = await window.brainrot.reviewAndAdvance({
      currentWeekId: reviewPayload.currentWeek.id,
      selections,
    })
    setCurrentWeek(nextWeek)
    setReviewPayload(null)
  }

  async function handleSaveSettings(): Promise<void> {
    if (!settingsDraft) {
      return
    }

    await flushSave()
    const templateResult = await window.brainrot.saveTemplates({
      left: leftTemplateDraft,
      right: rightTemplateDraft,
    })
    const saved = await window.brainrot.saveSettings(settingsDraft)
    setTemplates(templateResult.templates)
    setCurrentWeek(templateResult.currentWeek)
    setSettings(saved)
    setWorkspaceOverlay('none')
  }

  async function handleSearchArchive(query: string): Promise<void> {
    setArchiveQuery(query)
    if (!query.trim()) {
      setArchiveResults([])
      setArchivedWeek(null)
      return
    }

    setArchiveResults(await window.brainrot.searchArchive(query))
  }

  async function handleOpenArchivedWeek(filename: string): Promise<void> {
    setArchivedWeek(await window.brainrot.openArchivedWeek(filename))
  }

  async function handleExportArchivedWeek(filename: string): Promise<void> {
    await window.brainrot.exportArchivedMarkdown(filename)
  }

  if (!currentWeek || !settings) {
    return <div className="loading-shell">Loading BrainRoT...</div>
  }

  return (
    <div className="app-shell">
      <header className="header-bar">
        <div className="header-side header-side-left">
          <form
            className={`search-control ${searchExpanded ? 'is-expanded' : ''}`}
            onSubmit={(event) => {
              event.preventDefault()
              setWorkspaceOverlay('search')
              void handleSearchArchive(archiveQuery)
            }}
          >
            <button
              type="button"
              className="icon-button"
              aria-label="Search archive"
              onClick={() => setSearchExpanded((current) => !current)}
            >
              <SearchIcon />
            </button>
            <input
              className="search-input"
              placeholder="Search archive"
              value={archiveQuery}
              onBlur={() => {
                if (!archiveQuery.trim()) {
                  setSearchExpanded(false)
                }
              }}
              onChange={(event) => setArchiveQuery(event.target.value)}
            />
          </form>
        </div>

        <div className="header-center">
          <div className="app-identity">BrainRoT</div>
          <div className="header-meta">
            <span>{weekLabel(currentWeek.weekStart)}</span>
            <span>{currentWeek.filename}</span>
            <span>{renderSaveState(saveState)}</span>
          </div>
        </div>

        <div className="header-side header-side-right">
          <button className="subtle-button" onClick={() => void openReview()}>
            Review &amp; Advance
          </button>
          <button
            className="icon-button"
            aria-label="Settings"
            onClick={() => setWorkspaceOverlay('settings')}
          >
            <SettingsIcon />
          </button>
          <button className="primary-button" onClick={() => void flushSave()}>
            Save Now
          </button>
        </div>
      </header>

      <main className="workspace-shell">
        <div className="workspace-frame">
          <div className="workspace-divider" aria-hidden="true" />
        <PaneEditor
          title="Left Brain"
          accent="blue"
          value={leftDraft}
          decorations={leftDecorations}
          staleStyle={settings.staleStyle}
          textareaRef={leftRef}
          onBlur={() => void flushSave()}
          onChange={(value) => {
            setLeftDraft(value)
            queueSave(value, rightDraft)
          }}
        />
        <PaneEditor
          title="Right Brain"
          accent="orange"
          value={rightDraft}
          decorations={rightDecorations}
          staleStyle={settings.staleStyle}
          textareaRef={rightRef}
          onBlur={() => void flushSave()}
          onChange={(value) => {
            setRightDraft(value)
            queueSave(leftDraft, value)
          }}
        />
        </div>
      </main>

      <footer className="footer-bar">
        <span>Created {formatTimestamp(currentWeek.createdAt)}</span>
        <span>Last edited {formatTimestamp(currentWeek.updatedAt)}</span>
      </footer>

      {reviewPayload && (
        <ReviewModal
          payload={reviewPayload}
          onClose={() => setReviewPayload(null)}
          onConfirm={(selections) => void handleReviewAdvance(selections)}
        />
      )}

      {workspaceOverlay === 'settings' && settingsDraft && (
        <SettingsModal
          settings={settingsDraft}
          leftTemplate={leftTemplateDraft}
          rightTemplate={rightTemplateDraft}
          onClose={() => setWorkspaceOverlay('none')}
          onChange={setSettingsDraft}
          onChangeLeftTemplate={setLeftTemplateDraft}
          onChangeRightTemplate={setRightTemplateDraft}
          onSave={() => void handleSaveSettings()}
        />
      )}

      {workspaceOverlay === 'search' && (
        <SearchModal
          query={archiveQuery}
          results={archiveResults}
          archivedWeek={archivedWeek}
          onClose={() => setWorkspaceOverlay('none')}
          onChangeQuery={(value) => void handleSearchArchive(value)}
          onOpenArchived={(filename) => void handleOpenArchivedWeek(filename)}
          onExportArchived={(filename) => void handleExportArchivedWeek(filename)}
        />
      )}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M13.5 12.3l3.8 3.8-1.2 1.2-3.8-3.8a6 6 0 1 1 1.2-1.2ZM8.5 13a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z"
        fill="currentColor"
      />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M8.9 2h2.2l.4 2.1c.4.1.8.3 1.2.5l1.9-1.1 1.6 1.6-1.1 1.9c.2.4.4.8.5 1.2L18 8.9v2.2l-2.1.4c-.1.4-.3.8-.5 1.2l1.1 1.9-1.6 1.6-1.9-1.1c-.4.2-.8.4-1.2.5L11.1 18H8.9l-.4-2.1c-.4-.1-.8-.3-1.2-.5l-1.9 1.1-1.6-1.6 1.1-1.9c-.2-.4-.4-.8-.5-1.2L2 11.1V8.9l2.1-.4c.1-.4.3-.8.5-1.2L3.5 5.4l1.6-1.6 1.9 1.1c.4-.2.8-.4 1.2-.5L8.9 2Zm1.1 5.2A2.8 2.8 0 1 0 10 12.8a2.8 2.8 0 0 0 0-5.6Z"
        fill="currentColor"
      />
    </svg>
  )
}
