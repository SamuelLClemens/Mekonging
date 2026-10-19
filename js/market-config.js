// Public values for the shared Market (docs/EXCHANGE.md §2). Everything here ships to every
// browser and is public by design: the project URL, the publishable key (row-level security,
// not secrecy, protects the data; owner ruling 2026-10-12, §16) and the Turnstile site key.
//
// No secret ever goes in this file, or anywhere in the repository. scripts/check-secrets.py
// allows a publishable key in this file only, and fails on any secret key anywhere.

export const SUPABASE_URL = 'https://xnruspjauhmcrqxmjmxg.supabase.co';
export const SUPABASE_KEY = 'sb_publishable__ZAGqgjcYnC-seKBhkaxzQ_FkFCQG7y';

// The Turnstile widget "Mekonging market" (Managed), valid on www.mekonging.com only.
export const TURNSTILE_SITE_KEY = '0x4AAAAAAFbB8K8lC8KSWBgi';
// Cloudflare's published always-pass test key, used on 127.0.0.1 and localhost, where the real
// key's hostname check fails. Supabase holds the real secret, which refuses a test token, so a
// local page can never complete a real sign-in: development uses fixture mode instead.
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';

// The one origin where sign-in can complete: Supabase's Site URL and only Redirect URL, and the
// Turnstile widget's only hostname.
export const MARKET_HOST = 'www.mekonging.com';

// The closed-beta terms accepted at join. It must equal private.settings.terms_version, or
// market_join answers terms_outdated. Legal sign-off on the real terms gates M9, not M3.
export const TERMS_VERSION = 'beta-2026-10';

// The session's own localStorage key, outside js/state.js, so no backup, export or Travel circle
// share can carry it (they serialise the store, never this key).
export const AUTH_KEY = 'mk-market-auth';
