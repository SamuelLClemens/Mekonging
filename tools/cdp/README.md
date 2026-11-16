# tools/cdp: one stdlib Chrome DevTools client

`cdp.py` is the one client the drivers under `tools/` import to run headless Chrome over the DevTools protocol (slice Q2).
No websocket package is installed on this Mac, so it is about 300 lines of standard library: a masked RFC 6455 client,
a launcher and a few helpers. It replaces the copy that lived in `tools/style-digest/cdp.py` (`digest.py`,
`components.py`, `tools/lang-check/lang-check.py` and `drive-fix.py` now import it) and the one in the M3b session's notes.

```python
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'cdp'))
from cdp import Chrome, keep_awake

keep_awake()                                     # a run of more than a minute or two
with Chrome(extra_args=['--hide-scrollbars']) as c:
    c.send('Page.enable')
    c.send('Page.navigate', {'url': 'http://127.0.0.1:8742/#settings'})
    c.assert_visible()                           # HiddenPage if document.hidden
    print(c.js('document.title'))
```

| Name | What it does |
| --- | --- |
| `Chrome(profile_dir=None, port=None, extra_args=())` | Starts headless Chrome and connects to its first page. A profile passed in is left alone on `close()`; none passed makes one under `~/Library/Caches/mk-cdp/` and deletes it. |
| `c.send(method, params, timeout=120, session=None)` | One command; events that arrive first are kept in `c.events`. `session` is a flattened target session id (workers). |
| `c.call(method, **params)`, `c.js(expr)`, `c.wait(expr)`, `c.pump(s)` | Keyword form of `send`; evaluate in the page and await a promise; poll until truthy; read events for a while. |
| `c.visibility()`, `c.assert_visible()` | `document.hidden` and `visibilityState`; the second raises `HiddenPage` when the page is hidden. |
| `keep_awake()` | Starts `caffeinate -d -i -w <pid>`: the display stays awake until the calling process exits. |
| `free_port()`, `wait_http(url)`, `new_profile_dir()` | Small helpers. |

## What it takes care of

Each of these cost a session a rerun (`CLAUDE.md`, Environment and Verification):

- **`--no-sandbox`.** Without it the page loads `data:` URLs but every `http://127.0.0.1` navigation hangs: Chrome's network sandbox cannot open sockets here.
- **A profile outside `/private/tmp`.** Chrome does not start with one there; `Chrome()` refuses it.
- **A hidden page is refused, not measured.** macOS display sleep flips headless pages to `document.hidden` in the middle of a run, and a hidden page undercounts controls (Q1: `#settings` read 11 controls against 111). Use `keep_awake()` and `assert_visible()` together.
- **A timeout cannot corrupt the stream.** A frame leaves the buffer only when it is whole, so `pump()` and short timeouts are safe.
- **`Browser.close` fires no `pagehide`.** An app that flushes a debounced store on `pagehide` loses the last change: reload before closing a profile that a later run reuses.
- **The scratchpad is wiped when the desktop app restarts.** Keep a long run's profile and results under `~/Library/Caches/`.

`tools/style-tiles/capture.py` still carries its own older client (`WS`, `CDP`, `launch`) for the style-tile captures; port it to this one when that tool is next touched.
