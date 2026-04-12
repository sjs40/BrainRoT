import { parseMarkdownSections } from '@shared/markdown'

export function ReadOnlyPane({
  title,
  accent,
  value,
}: {
  title: string
  accent?: 'blue' | 'orange'
  value: string
}) {
  const sections = parseMarkdownSections(value)
  return (
    <section className={`readonly-pane ${accent ? `workspace-pane--${accent}` : ''}`}>
      <div className="workspace-pane-header">{title}</div>
      <div className="readonly-content">
        {sections.map((section, index) => (
          <div key={`${title}-${index}`} className="readonly-section">
            {section.heading && <h3>{section.heading}</h3>}
            <pre>{section.lines.join('\n')}</pre>
          </div>
        ))}
      </div>
    </section>
  )
}
