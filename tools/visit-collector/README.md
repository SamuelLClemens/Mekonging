# Visitor-pin collector (optional, not deployed by this project)

Mekonging's **Where people are** screen always works: it maps the places *your own device* has
opened the app from, stored locally and rounded to a ~55 km grid cell so no pin can place
anyone. The shared half of that map — everyone else's pins — needs somewhere to aggregate them,
and this project deliberately does not run one. A static travel app that quietly collects its
users' locations is exactly what it declines to be.

If you want the shared map, run this yourself. Then you own the endpoint and the data, and the
app points at your URL rather than anybody else's.

## Deploy

```bash
npm install -g wrangler
wrangler login
wrangler kv namespace create VISITS      # paste the returned id into wrangler.toml
wrangler deploy
```

Then in the app: **Settings → Where people are → Shared pin feed URL**, paste
`https://<name>.<your-subdomain>.workers.dev/visits`.

One more step, and the map will silently show only your own pins without it: add that origin to
`connect-src` in `index.html`'s Content-Security-Policy. The app cannot fetch an origin the page
has not declared, which is the point of the policy.

Contributing your own pins to the feed is a **separate** switch on the same screen. It is off
until you turn it on.

## What it stores

| Field | Value |
|---|---|
| `lat`, `lng` | the centre of a 0.5° grid cell (about 55 km) |
| `n` | how many app-opens have come from that cell |
| `cc` | a country code, up to four characters |

Nothing else. No IP address, no user agent, no cookie, no session, no timestamp finer than a
day, and no identifier that could link two visits to one person or one device. Only the count
grows, so the store cannot be turned into a history of anybody's travel.

## Endpoints

- `GET /visits` → `{ "points": [ { "lat": 13.5, "lng": 100.5, "n": 42, "cc": "th" } ] }`
- `POST /visits` with `{ "lat": 13.7, "lng": 100.5, "cc": "th" }` → increments that cell

Both are CORS-open, because the response is public aggregate data and the request carries
nothing private. Fields other than the three above are ignored rather than stored, so a future
client that sends more cannot accidentally have it kept.
