/// <reference types="vite/client" />

import type { BrainRoTApi } from './shared/types'

declare global {
  interface Window {
    brainrot: BrainRoTApi
  }
}

export {}
