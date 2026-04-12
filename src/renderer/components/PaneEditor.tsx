import { useRef } from 'react'
import type { RefObject } from 'react'
import type { Settings } from '@shared/types'
import type { LineDecoration } from '../utils'

export function PaneEditor({
  title,
  accent,
  value,
  decorations,
  staleStyle,
  onChange,
  onBlur,
  textareaRef,
}: {
  title: string
  accent?: 'blue' | 'orange'
  value: string
  decorations: LineDecoration[]
  staleStyle: Settings['staleStyle']
  onChange: (value: string) => void
  onBlur: () => void
  textareaRef: RefObject<HTMLTextAreaElement | null>
}) {
  const overlayRef = useRef<HTMLPreElement | null>(null)

  return (
    <section className={`workspace-pane ${accent ? `workspace-pane--${accent}` : ''}`}>
      <div className="workspace-pane-header">{title}</div>
      <div className="editor-shell">
        <pre ref={overlayRef} className="editor-overlay" aria-hidden="true">
          {decorations.map((line, index) => (
            <span
              key={`${title}-${index}`}
              className={[
                'mirror-line',
                getLineTone(line.text),
                line.meta?.isStale ? `stale-${staleStyle} is-stale` : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {line.text || ' '}
              {line.meta && (
                <span className="carry-indicator">carried {line.meta.carryCount}x</span>
              )}
              {'\n'}
            </span>
          ))}
        </pre>
        <textarea
          ref={textareaRef}
          className="editor-input"
          spellCheck={false}
          value={value}
          onBlur={onBlur}
          onScroll={(event) => {
            if (overlayRef.current) {
              overlayRef.current.scrollTop = event.currentTarget.scrollTop
              overlayRef.current.scrollLeft = event.currentTarget.scrollLeft
            }
          }}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </section>
  )
}

function getLineTone(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) {
    return ''
  }

  if (/^#{1,6}\s+/.test(trimmed)) {
    return 'is-heading'
  }

  if (/^-\s*$/.test(trimmed)) {
    return 'is-placeholder'
  }

  return 'is-body'
}
