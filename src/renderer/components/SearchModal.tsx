import type { ArchiveSearchResult, BrainSheet } from '@shared/types'
import { ReadOnlyPane } from './ReadOnlyPane'
import { Modal } from './Modal'
import { formatTimestamp } from '../utils'

export function SearchModal({
  query,
  results,
  archivedWeek,
  onClose,
  onChangeQuery,
  onOpenArchived,
  onExportArchived,
}: {
  query: string
  results: ArchiveSearchResult[]
  archivedWeek: BrainSheet | null
  onClose: () => void
  onChangeQuery: (value: string) => void
  onOpenArchived: (filename: string) => void
  onExportArchived: (filename: string) => void
}) {
  return (
    <Modal title="Search Archive" onClose={onClose}>
      <div className="form-stack">
        <input
          placeholder="Search archived weeks"
          value={query}
          onChange={(event) => onChangeQuery(event.target.value)}
        />
        <div className="search-layout">
          <div className="search-results">
            {results.map((result) => (
              <button
                key={result.filename}
                className="search-result"
                onClick={() => onOpenArchived(result.filename)}
              >
                <strong>{result.filename}</strong>
                <span>{result.weekLabel}</span>
                <p>{result.snippet}</p>
              </button>
            ))}
          </div>

          {archivedWeek && (
            <div className="archived-view">
              <div className="archived-header">
                <div>
                  <strong>{archivedWeek.filename}</strong>
                  <span>Archived {formatTimestamp(archivedWeek.archivedAt)}</span>
                </div>
                <button onClick={() => onExportArchived(archivedWeek.filename)}>
                  Export as Markdown
                </button>
              </div>
              <div className="archived-meta">
                <span>{archivedWeek.filename}</span>
                <span>{archivedWeek.weekStart} to {archivedWeek.weekEnd}</span>
              </div>
              <div className="archived-panels">
                <ReadOnlyPane title="Archived Left Brain" accent="blue" value={archivedWeek.leftBrain} />
                <ReadOnlyPane title="Archived Right Brain" accent="orange" value={archivedWeek.rightBrain} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
