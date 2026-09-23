// The eight phrasebooks, in one map, loaded on demand via js/lazy-data.js.
//
// They used to be eight static imports in js/data/regions.js — which is reached from
// js/screens/home.js, so all 107.6 KB of them parsed on every launch, for every traveller,
// including the ones who never open Talk. regions.js needs none of it: COUNTRIES and the
// place lookups are what Home actually reads, and only the `lang` STRING on each country ties
// a country to its book.
//
// Split out rather than made lazy in place so the eager graph cannot quietly re-acquire them:
// nothing that launches imports this file, and the only route to it is loadData('phrasebooks').
import { PHRASEBOOK_TH } from './phrasebook.th.js';
import { PHRASEBOOK_VI } from './phrasebook.vi.js';
import { PHRASEBOOK_KM } from './phrasebook.km.js';
import { PHRASEBOOK_LO } from './phrasebook.lo.js';
import { PHRASEBOOK_ZH } from './phrasebook.zh.js';
import { PHRASEBOOK_MY } from './phrasebook.my.js';
import { PHRASEBOOK_MS } from './phrasebook.ms.js';
import { PHRASEBOOK_HMN } from './phrasebook.hmn.js';

export const LANGUAGES = {
  th: PHRASEBOOK_TH,
  vi: PHRASEBOOK_VI,
  km: PHRASEBOOK_KM,
  lo: PHRASEBOOK_LO,
  zh: PHRASEBOOK_ZH,
  my: PHRASEBOOK_MY,
  ms: PHRASEBOOK_MS,
  hmn: PHRASEBOOK_HMN,
};

export function getLanguage(code) { return LANGUAGES[code] || null; }
