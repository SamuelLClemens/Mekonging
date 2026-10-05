// The theme table, with no imports. js/main.js applyTheme() reads it; so do the guards
// (scripts/check-contrast.py, scripts/check-skins.py) and tools/style-tiles/capture.py, which parse
// this file as text, so keep SKIN_MODE a plain object literal of  id: 'dark' | 'light' | 'auto'.
//
// 'auto' means the traveller's light / dark setting decides (Settings, then the device, then the
// clock). The six legacy skins keep the one mode they were drawn for. `retro`, `river`, `flags`
// and `temples` are the four themes of the retro redesign (VISUAL_DIRECTION_PROMPT.md section 3);
// their palettes arrive in Phase 3, so until then a stored one resolves to Classic's colours.
//
// DEFAULT_SKIN is what a profile with no skin, or an unknown one, renders as. Phase 4 flips it.
export const DEFAULT_SKIN = 'classic';

export const SKIN_MODE = {
  classic: 'auto', retro: 'auto', river: 'auto', flags: 'auto', temples: 'auto',
  night: 'dark', psychnight: 'dark', expedition: 'dark',
  silk: 'light', tropical: 'light', psych: 'light',
};

// An unknown id (a skin retired later, or one from a newer build after a rollback) renders as the default.
export function resolveSkin(id) {
  return Object.prototype.hasOwnProperty.call(SKIN_MODE, id) ? id : DEFAULT_SKIN;
}

// The data-theme a skin renders in. `autoMode` is what an 'auto' skin resolves to.
export function modeFor(skin, autoMode) {
  const m = SKIN_MODE[skin];
  return m === 'light' || m === 'dark' ? m : autoMode;
}
