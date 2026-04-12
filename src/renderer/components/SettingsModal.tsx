import type { Settings } from '@shared/types'
import { Modal } from './Modal'

export function SettingsModal({
  settings,
  leftTemplate,
  rightTemplate,
  onClose,
  onChange,
  onChangeLeftTemplate,
  onChangeRightTemplate,
  onSave,
}: {
  settings: Settings
  leftTemplate: string
  rightTemplate: string
  onClose: () => void
  onChange: (next: Settings) => void
  onChangeLeftTemplate: (value: string) => void
  onChangeRightTemplate: (value: string) => void
  onSave: () => void
}) {
  return (
    <Modal title="Settings" onClose={onClose}>
      <div className="settings-layout">
        <section className="settings-group">
          <div className="settings-group-header">
            <h3>General</h3>
            <p>Core behavior and visual preferences.</p>
          </div>
          <div className="form-stack">
            <label>
              Stale threshold
              <input
                type="number"
                min={1}
                value={settings.staleThreshold}
                onChange={(event) =>
                  onChange({
                    ...settings,
                    staleThreshold: Number(event.target.value),
                  })
                }
              />
            </label>
            <label>
              Stale style
              <select
                value={settings.staleStyle}
                onChange={(event) =>
                  onChange({
                    ...settings,
                    staleStyle: event.target.value as Settings['staleStyle'],
                  })
                }
              >
                <option value="highlight">highlight</option>
                <option value="red">red</option>
              </select>
            </label>
            <label>
              Theme
              <select
                value={settings.theme}
                onChange={(event) =>
                  onChange({
                    ...settings,
                    theme: event.target.value as Settings['theme'],
                  })
                }
              >
                <option value="light">light</option>
                <option value="dark">dark</option>
                <option value="system">system</option>
              </select>
            </label>
          </div>
        </section>

        <section className="settings-group">
          <div className="settings-group-header">
            <h3>Templates</h3>
            <p>Used for future weeks and applied to the current active week on save.</p>
          </div>
          <div className="modal-grid">
            <label>
              Left Template
              <textarea value={leftTemplate} onChange={(event) => onChangeLeftTemplate(event.target.value)} />
            </label>
            <label>
              Right Template
              <textarea value={rightTemplate} onChange={(event) => onChangeRightTemplate(event.target.value)} />
            </label>
          </div>
        </section>
      </div>
      <div className="modal-actions">
        <button onClick={onClose}>Cancel</button>
        <button className="primary-button" onClick={onSave}>
          Save Changes
        </button>
      </div>
    </Modal>
  )
}
