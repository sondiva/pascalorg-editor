import type { MessageDescriptor } from '@pascal-app/core'
import { create } from 'zustand'

/**
 * The walkthrough prompt: `label` is the target's own name (scene data, shown
 * as-is) or a fallback descriptor for an unnamed target; `verb` stays a code
 * ('open', 'close', 'turn on', ...) because callers also match on it, and the
 * HUD translates it when it renders.
 */
export type WalkthroughInteract = { label: string | MessageDescriptor; verb: string } | null

export type FirstPersonHudState = {
  floorLabel: string | null
  zoneLabel: string | null
  interact: WalkthroughInteract
  setHud: (hud: Partial<Pick<FirstPersonHudState, 'floorLabel' | 'zoneLabel' | 'interact'>>) => void
  reset: () => void
}

export const useFirstPersonHud = create<FirstPersonHudState>((set) => ({
  floorLabel: null,
  zoneLabel: null,
  interact: null,
  setHud: (hud) =>
    set((state) => {
      const floorLabel = hud.floorLabel === undefined ? state.floorLabel : hud.floorLabel
      const zoneLabel = hud.zoneLabel === undefined ? state.zoneLabel : hud.zoneLabel
      const interact = hud.interact === undefined ? state.interact : hud.interact

      if (
        floorLabel === state.floorLabel &&
        zoneLabel === state.zoneLabel &&
        interact?.label === state.interact?.label &&
        interact?.verb === state.interact?.verb
      ) {
        return state
      }

      return { floorLabel, zoneLabel, interact }
    }),
  reset: () =>
    set((state) =>
      state.floorLabel === null && state.zoneLabel === null && state.interact === null
        ? state
        : { floorLabel: null, zoneLabel: null, interact: null },
    ),
}))
