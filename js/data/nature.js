// Regional field guide — plants, animals, fish, birds, reptiles, insects and
// dangerous species you can identify across Thailand/Vietnam/Cambodia/Laos.
// Identification is description-based (field marks) plus a "search images" deep
// link; no photos are bundled. Filled by the content workflow.

export const NATURE_GROUPS = [
  { id: 'bird', label: 'Birds', emoji: '🐦' },
  { id: 'mammal', label: 'Mammals', emoji: '🐘' },
  { id: 'fish', label: 'Fish & marine', emoji: '🐠' },
  { id: 'reptile', label: 'Reptiles & amphibians', emoji: '🦎' },
  { id: 'plant', label: 'Plants & trees', emoji: '🌿' },
  { id: 'insect', label: 'Insects', emoji: '🦋' },
  { id: 'danger', label: 'Dangerous', emoji: '⚠️' },
];

// species: { id, group, commonName, sciName, localNames:[], blurb, idTips, habitat,
//            where, dangerous:bool, dangerNote, emoji }
export const NATURE = [];

export function allSpecies(filter = {}) {
  let out = NATURE.slice();
  if (filter.group) out = out.filter((s) => s.group === filter.group || (filter.group === 'danger' && s.dangerous));
  if (filter.q) {
    const q = filter.q.toLowerCase();
    out = out.filter((s) => [s.commonName, s.sciName, (s.localNames || []).join(' '), s.blurb]
      .join(' ').toLowerCase().includes(q));
  }
  return out;
}
export function getSpecies(id) { return NATURE.find((s) => s.id === id) || null; }
