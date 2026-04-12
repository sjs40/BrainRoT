import type { Settings, Templates } from './types.js'

export const APP_FOLDER_NAME = 'BrainSheet'
export const LEFT_TEMPLATE_FILE = 'left_template.md'
export const RIGHT_TEMPLATE_FILE = 'right_template.md'
export const SETTINGS_FILE = 'settings.json'

export const DEFAULT_TEMPLATES: Templates = {
  left: `# Top 5 Priorities
- 

# To-do
- 

# People
- 

# Businesses / Projects
- 

# Themes
- 

# Follow-ups / Loose Ends
- 

# Personal / Health
- `,
  right: `# Ideas
- 

# Team / Leadership
- 

# Business Building
- 

# Long-Term / Future
- `,
}

export const DEFAULT_SETTINGS: Settings = {
  staleThreshold: 3,
  staleStyle: 'highlight',
  theme: 'system',
  keyboardShortcuts: {
    focusLeftPane: 'Mod+Alt+Left',
    focusRightPane: 'Mod+Alt+Right',
    reviewAndAdvance: 'Alt+R',
    openSearch: 'Alt+K',
  },
}
