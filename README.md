# BrainRoT

> A focused desktop tool for weekly priorities and long-term thinking.

BrainRoT is built around a simple idea from investor Alan Waxman: the scarcest resource isn't capital — it's time. His system uses two pages, revisited constantly, to surface what matters most and keep good ideas close.

---

## The System

**Left Brain** — execution space: active priorities, commitments, people, and follow-ups. A live snapshot of where your attention should go.

**Right Brain** — exploration space: ideas, long-term thinking, and possibilities that may matter later. Ideas can sit here for years and resurface when relevant.

The two panes are intentionally separate. Execution and exploration serve different jobs, and mixing them creates noise.

This is not a PKM system, a project manager, or a collaborative tool. It is designed to do one thing well: help you decide where your time should go, and make sure nothing important gets lost.

---

## Features

- Dual-pane weekly brain sheets with 1.2-second auto-save
- Weekly review workflow — select what to carry forward, preview the next week, then advance
- Stale item detection — items carried too many times are visually flagged
- Archive with full-text search and markdown export
- Customisable templates applied to new weeks
- Light / dark / system theme
- Keyboard shortcuts for all core actions
- All data stored locally as plain JSON — no accounts, no sync, no cloud

---

## Requirements

- **macOS**, **Windows**, or **Linux**
- **Node.js 18+** (development only)

---

## Installation

Download the latest release for your platform from the [Releases page](https://github.com/sjs40/brainrot/releases).

| Platform | File |
|----------|------|
| macOS (Apple Silicon) | `BrainRoT-{version}-arm64.dmg` |
| macOS (Intel) | `BrainRoT-{version}-x64.dmg` |
| Windows | `BrainRoT-Setup-{version}.exe` |
| Linux | `BrainRoT-{version}.AppImage` |

---

## Development

### Setup

```bash
git clone https://github.com/sjs40/brainrot.git
cd brainrot
npm install
```

### Run

```bash
npm run dev
```

Starts the Vite dev server and launches Electron against it. Renderer changes hot-reload. Main process changes require restarting `npm run dev`.

### Checks

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript (main process + renderer)
npm test            # Unit tests (Vitest)
npm run test:watch  # Vitest in watch mode
```

### Build

```bash
npm run build
```

Compiles TypeScript and bundles the renderer. Output goes to `dist/` and `dist-electron/`.

### Package

```bash
npm run package
```

Runs `build` then packages the app for the current platform using `electron-builder`. Output goes to `release/`.

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|---------|
| Focus Left Pane | `Ctrl / ⌘` + `Alt` + `←` |
| Focus Right Pane | `Ctrl / ⌘` + `Alt` + `→` |
| Review & Advance | `Alt` + `R` |
| Search Archive | `Alt` + `K` |
| Save | `Ctrl / ⌘` + `S` |
| Open Settings | `Ctrl / ⌘` + `,` |

---

## Data Storage

All data is stored locally in your OS user data directory as plain JSON files. No cloud, no accounts.

| Platform | Path |
|----------|------|
| macOS | `~/Library/Application Support/BrainRoT/BrainSheet/` |
| Windows | `%APPDATA%\BrainRoT\BrainSheet\` |
| Linux | `~/.config/BrainRoT/BrainSheet/` |

**Structure:**

```
BrainSheet/
├── active/      ← current week JSON
├── archive/     ← completed weeks JSON
├── templates/   ← left and right markdown templates
└── settings.json
```

Files are human-readable and can be backed up manually at any time.

---

## Design Principles

- **Minimal structure** — enough organisation to create clarity, without turning thinking into admin work.
- **Frequent revision** — the value comes from revisiting the system, not from creating a perfect snapshot once.
- **Priority over volume** — the point is not to capture everything; it is to surface what matters most.
- **Ideas should compound** — good thoughts often look unimportant at first; keeping them in one place lets them reconnect over time.

---

## Project Status

Early release (`v0.1.0`). The core workflow — write, review, advance — is stable. No data has been lost in testing. Back up your data directory before major updates.

---

## Roadmap

- Customisable keyboard shortcuts (the data model is already in place)
- App auto-update support
- "Open Data Folder" shortcut in Settings

---

## Known Limitations

- No undo / redo across sessions
- Archive search is basic substring matching — no regex or operators
- No cloud sync or multi-device support

---

## License

MIT — see [LICENSE](LICENSE).
