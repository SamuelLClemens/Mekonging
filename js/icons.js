// The app's one line-icon family (docs/PROGRAM.md 5.3 item 5): about fifty Lucide glyphs in one self-hosted sprite,
// icons/ui.svg (ISC licence, icons/LICENSE-lucide.txt; scripts/build-icon-sprite.py builds it). An icon is a <svg
// class="icon"> that references one symbol, so it takes the text colour of every skin and draws at --icon-size with
// --icon-stroke (css/refined.css). Emoji stay only inside content, where they carry meaning.
//
// js/nav-groups.js gives every group and feature an `icon:` id beside its `ic:` emoji; nothing reads it until the
// roll-out (R1 to R3) swaps a screen's chrome over. scripts/check-icons.py keeps every id used here, there and in
// the sprite in step.

export const ICON_SPRITE = 'icons/ui.svg';
const NS = 'http://www.w3.org/2000/svg';
const ID = /^[a-z0-9-]+$/;

// The markup for one icon. `cls` adds classes after `icon`. The id is a constant of the app, never user text.
export function iconSVG(id, cls) {
  if (!ID.test(id)) return '';
  return '<svg class="icon' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false">'
    + '<use href="' + ICON_SPRITE + '#' + id + '"/></svg>';
}

// The same icon as a node. It is decorative: the control that holds it carries the accessible name.
export function iconNode(id, cls) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'icon' + (cls ? ' ' + cls : ''));
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  if (!ID.test(id)) return svg;
  const use = document.createElementNS(NS, 'use');
  use.setAttribute('href', ICON_SPRITE + '#' + id);
  svg.append(use);
  return svg;
}
