import { useMemo, useState } from 'react'
import { applySelectionsToWeek } from '@shared/review'
import type { ReviewPayload, ReviewSelection, SelectableCarryLine } from '@shared/types'
import { ReadOnlyPane } from './ReadOnlyPane'

export function ReviewModal({
  payload,
  onClose,
  onConfirm,
}: {
  payload: ReviewPayload
  onClose: () => void
  onConfirm: (selections: ReviewSelection[]) => void
}) {
  const [selectionState, setSelectionState] = useState<Record<string, ReviewSelection>>({})

  const grouped = useMemo(() => {
    const groups = new Map<string, SelectableCarryLine[]>()
    for (const line of payload.selectableLines) {
      const key = `${line.pane}:${line.heading ?? 'Reorganize'}`
      const list = groups.get(key) ?? []
      list.push(line)
      groups.set(key, list)
    }
    return [...groups.entries()]
  }, [payload.selectableLines])

  const previewWeek = useMemo(
    () => applySelectionsToWeek(payload, payload.nextWeek, Object.values(selectionState)),
    [payload, selectionState],
  )

  return (
    <div className="review-backdrop">
      <div className="review-panel">
        <div className="modal-header">
          <div>
            <h2>Review and Advance</h2>
            <p className="review-subtitle">
              Select lines to carry into {payload.nextWeek.filename}.
            </p>
          </div>
          <button onClick={onClose}>Close</button>
        </div>

        <div className="review-sources">
          <ReadOnlyPane title="Current Left Brain" accent="blue" value={payload.currentWeek.leftBrain} />
          <ReadOnlyPane title="Current Right Brain" accent="orange" value={payload.currentWeek.rightBrain} />
        </div>

        <div className="review-flow-layout">
          <section className="review-selection-panel">
            <div className="workspace-pane-header">Carry Forward Selections</div>
            <div className="review-selection-body">
              {grouped.map(([groupKey, lines]) => (
                <section key={groupKey} className="review-group">
                  <div className="review-heading">
                    <strong>{lines[0].pane === 'left' ? 'Left Brain' : 'Right Brain'}</strong>
                    <span>{lines[0].heading ?? 'Reorganize'}</span>
                  </div>
                  {lines.map((line) => {
                    const selection = selectionState[line.id]
                    return (
                      <div key={line.id} className="review-row">
                        <input
                          type="checkbox"
                          checked={Boolean(selection)}
                          onChange={(event) => {
                            if (!event.target.checked) {
                              const next = { ...selectionState }
                              delete next[line.id]
                              setSelectionState(next)
                              return
                            }

                            setSelectionState({
                              ...selectionState,
                              [line.id]: {
                                sourceId: line.id,
                                targetPane: line.pane,
                                text: line.text,
                              },
                            })
                          }}
                        />
                        <select
                          value={selection?.targetPane ?? line.pane}
                          disabled={!selection}
                          onChange={(event) =>
                            setSelectionState({
                              ...selectionState,
                              [line.id]: {
                                sourceId: line.id,
                                targetPane: event.target.value as ReviewSelection['targetPane'],
                                text: selection?.text ?? line.text,
                              },
                            })
                          }
                        >
                          <option value="left">left</option>
                          <option value="right">right</option>
                        </select>
                        <input
                          value={selection?.text ?? line.text}
                          disabled={!selection}
                          onChange={(event) =>
                            setSelectionState({
                              ...selectionState,
                              [line.id]: {
                                sourceId: line.id,
                                targetPane: selection?.targetPane ?? line.pane,
                                text: event.target.value,
                              },
                            })
                          }
                        />
                        <span className="review-carry">
                          {line.carryCount > 0 ? `carried ${line.carryCount}x` : 'new carry'}
                        </span>
                      </div>
                    )
                  })}
                </section>
              ))}
            </div>
          </section>

          <section className="review-preview-panel">
            <div className="workspace-pane-header">Next Week Preview</div>
            <div className="review-preview-meta">
              <span>{previewWeek.filename}</span>
              <span>{previewWeek.weekStart} to {previewWeek.weekEnd}</span>
            </div>
            <div className="review-preview-panes">
              <ReadOnlyPane title="Next Left Brain" accent="blue" value={previewWeek.leftBrain} />
              <ReadOnlyPane title="Next Right Brain" accent="orange" value={previewWeek.rightBrain} />
            </div>
          </section>
        </div>

        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button
            className="primary-button"
            onClick={() => onConfirm(Object.values(selectionState))}
          >
            Archive Current Week and Open Next Week
          </button>
        </div>
      </div>
    </div>
  )
}
