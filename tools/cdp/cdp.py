"""Shared stdlib Chrome DevTools Protocol client for the drivers under tools/ (slice Q2).

No websocket package is installed on the development machine, so this is a small RFC 6455 client
(masked client frames, no Origin header, so Chrome needs no --remote-allow-origins) and a headless
Chrome launcher. It replaces the copies that lived in tools/style-digest/cdp.py and the notes folder
of the M3b session, and it is what the next driver should import:

    import os, sys
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'cdp'))
    from cdp import Chrome, keep_awake

    keep_awake()                                    # for any run longer than a minute or two
    with Chrome(extra_args=['--hide-scrollbars']) as c:
        c.send('Page.enable')
        c.send('Page.navigate', {'url': 'http://127.0.0.1:8742/#settings'})
        c.assert_visible()                          # raises HiddenPage on a hidden page
        print(c.js('document.title'))

What it takes care of, so a driver does not rediscover it (CLAUDE.md, Environment and Verification):

- Chrome starts with --no-sandbox. Without it the page loads data: URLs but every http://127.0.0.1
  navigation hangs, because Chrome's network sandbox cannot open sockets here.
- The profile lives under ~/Library/Caches/mk-cdp/, never under /private/tmp (Chrome does not start
  there), and is deleted on close when this client made it. A profile you pass in is left alone.
- A hidden page is refused, not measured. macOS display sleep flips headless pages to
  document.hidden in the middle of a run, and a hidden page undercounts controls (Q1: #settings read
  11 controls against 111). keep_awake() starts `caffeinate -d` for the life of the calling process
  and assert_visible() raises HiddenPage; use both.
- A read that times out leaves no half-read frame behind, so pump() and short timeouts are safe.
- Events (console, exceptions, log entries, network) are kept in Chrome.events for the driver to digest.

Standard library only; written for the system Python 3.9.
"""
import base64
import json
import os
import shutil
import socket
import struct
import subprocess
import tempfile
import time
import urllib.request

CHROME = os.environ.get('CHROME') or '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
CACHE_ROOT = os.path.join(os.path.expanduser('~'), 'Library', 'Caches', 'mk-cdp')


class HiddenPage(RuntimeError):
    """The page reports document.hidden, so a measurement taken now would be wrong."""


# ---- helpers -------------------------------------------------------------------------------------

def free_port():
    """A TCP port nothing is listening on right now."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


def new_profile_dir(prefix='chrome'):
    """A fresh empty Chrome profile folder under ~/Library/Caches/mk-cdp/."""
    os.makedirs(CACHE_ROOT, exist_ok=True)
    return tempfile.mkdtemp(prefix=prefix + '-', dir=CACHE_ROOT)


def check_profile_dir(path):
    """Refuse a profile folder Chrome cannot start in (anywhere under /tmp)."""
    real = os.path.realpath(path)
    if real.startswith(('/private/tmp', '/private/var/tmp', '/tmp')):
        raise ValueError('Chrome does not start with a profile under /private/tmp: use ~/Library/Caches (%s)' % path)


def keep_awake():
    """Keep the display from sleeping while this process lives (macOS `caffeinate -d -i -w <pid>`).

    Returns the caffeinate process, or None where caffeinate is missing (the hidden-page check in
    Chrome.assert_visible() still refuses a bad measurement there)."""
    exe = shutil.which('caffeinate')
    if not exe:
        return None
    return subprocess.Popen([exe, '-d', '-i', '-w', str(os.getpid())],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def wait_http(url, timeout=30):
    """True once a GET of url answers 200, False after `timeout` seconds."""
    end = time.time() + timeout
    while time.time() < end:
        try:
            with urllib.request.urlopen(url, timeout=2) as r:
                if r.status == 200:
                    return True
        except (OSError, ValueError):
            pass
        time.sleep(0.25)
    return False


# ---- websocket -----------------------------------------------------------------------------------

class WS:
    """A minimal RFC 6455 client: masked client frames, fragmented and ping frames handled."""

    def __init__(self, url, timeout=30):
        assert url.startswith('ws://'), url
        hostport, path = url[5:].split('/', 1)
        host, port = hostport.rsplit(':', 1)
        self.sock = socket.create_connection((host, int(port)), timeout=timeout)
        key = base64.b64encode(os.urandom(16)).decode()
        self.sock.sendall(('GET /%s HTTP/1.1\r\nHost: %s\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n'
                           'Sec-WebSocket-Key: %s\r\nSec-WebSocket-Version: 13\r\n\r\n' % (path, hostport, key)).encode())
        resp = b''
        while b'\r\n\r\n' not in resp:
            chunk = self.sock.recv(4096)
            if not chunk:
                raise ConnectionError('websocket handshake: connection closed')
            resp += chunk
        head, rest = resp.split(b'\r\n\r\n', 1)
        if b' 101 ' not in head.split(b'\r\n')[0]:
            raise ConnectionError('websocket handshake refused: ' + head.decode(errors='replace'))
        self.buf = bytearray(rest)
        self.parts = []

    def _send_frame(self, opcode, payload):
        hdr = bytearray([0x80 | opcode])
        n = len(payload)
        if n < 126:
            hdr.append(0x80 | n)
        elif n < 65536:
            hdr.append(0x80 | 126)
            hdr += struct.pack('>H', n)
        else:
            hdr.append(0x80 | 127)
            hdr += struct.pack('>Q', n)
        mask = os.urandom(4)
        hdr += mask
        self.sock.sendall(bytes(hdr) + bytes(b ^ mask[i & 3] for i, b in enumerate(payload)))

    def send(self, text):
        self._send_frame(0x1, text.encode())

    def _take_frame(self):
        """(fin, opcode, payload) when a whole frame is buffered, else None.

        Bytes leave the buffer only with a whole frame, so a timeout never strands half of one."""
        buf = self.buf
        if len(buf) < 2:
            return None
        b1, b2 = buf[0], buf[1]
        n, off = b2 & 0x7F, 2
        if n == 126:
            if len(buf) < 4:
                return None
            n, off = struct.unpack('>H', bytes(buf[2:4]))[0], 4
        elif n == 127:
            if len(buf) < 10:
                return None
            n, off = struct.unpack('>Q', bytes(buf[2:10]))[0], 10
        mask = None
        if b2 & 0x80:
            if len(buf) < off + 4:
                return None
            mask, off = bytes(buf[off:off + 4]), off + 4
        if len(buf) < off + n:
            return None
        payload = bytes(buf[off:off + n])
        del buf[:off + n]
        if mask:
            payload = bytes(b ^ mask[i & 3] for i, b in enumerate(payload))
        return b1 & 0x80, b1 & 0x0F, payload

    def recv(self, timeout=None):
        """One text message. Raises TimeoutError when none completes within `timeout` seconds."""
        end = None if timeout is None else time.time() + timeout
        while True:
            frame = self._take_frame()
            if frame is None:
                if end is None:
                    self.sock.settimeout(None)
                else:
                    left = end - time.time()
                    if left <= 0:
                        raise TimeoutError('websocket recv')
                    self.sock.settimeout(left)
                try:
                    chunk = self.sock.recv(1 << 20)
                except socket.timeout:
                    raise TimeoutError('websocket recv')
                if not chunk:
                    raise ConnectionError('websocket closed')
                self.buf += chunk
                continue
            fin, op, data = frame
            if op == 0x8:
                raise ConnectionError('websocket closed by peer')
            if op == 0x9:
                self._send_frame(0xA, data)
                continue
            if op == 0xA:
                continue
            self.parts.append(data)
            if fin:
                msg, self.parts = b''.join(self.parts), []
                return msg.decode('utf-8', 'replace')


# ---- Chrome --------------------------------------------------------------------------------------

class Chrome:
    """Headless Chrome with its own profile, driven over its first page target.

    Chrome(profile_dir=None, port=None, extra_args=())
      profile_dir  a folder to use (left alone on close); None makes a fresh one and deletes it on close
      port         the remote debugging port; None picks a free one
      extra_args   more Chrome flags, e.g. ['--hide-scrollbars', '--enable-unsafe-swiftshader',
                   '--window-size=375,812'] or ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1']
    """

    def __init__(self, profile_dir=None, port=None, extra_args=()):
        self.own_profile = profile_dir is None
        self.profile = profile_dir or new_profile_dir()
        check_profile_dir(self.profile)
        self.port = port or free_port()
        args = [CHROME, '--headless=new', '--remote-debugging-port=%d' % self.port, '--user-data-dir=' + self.profile,
                '--no-first-run', '--no-default-browser-check', '--no-proxy-server', '--no-sandbox',
                '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
                '--disable-backgrounding-occluded-windows', *extra_args, 'about:blank']
        self.log_path = self.profile.rstrip('/') + '.log'
        self.log = open(self.log_path, 'w')
        self.proc = subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=self.log)
        self.ws = None
        self.seq = 0
        self.events = []
        page = None
        for _ in range(900):
            if self.proc.poll() is not None:
                code = self.proc.returncode
                self.close()
                raise RuntimeError('Chrome exited at start (code %s), see %s' % (code, self.log_path))
            try:
                with urllib.request.urlopen('http://127.0.0.1:%d/json/list' % self.port, timeout=1) as r:
                    pages = [t for t in json.load(r) if t.get('type') == 'page']
                if pages:
                    page = pages[0]
                    break
            except (OSError, ValueError):
                pass
            time.sleep(0.1)
        if page is None:
            self.close()
            raise RuntimeError('Chrome did not expose a page target')
        self.ws = WS(page['webSocketDebuggerUrl'])

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()

    def version(self):
        """The browser's own version string, e.g. 'Chrome/157.0.8103.51'."""
        with urllib.request.urlopen('http://127.0.0.1:%d/json/version' % self.port, timeout=5) as r:
            return json.load(r).get('Browser', '')

    def send(self, method, params=None, timeout=120, session=None):
        """One command; returns its result. Events that arrive first are kept in self.events.

        `session` is a flattened target session id (Target.setAutoAttach with flatten) for a worker."""
        self.seq += 1
        mid = self.seq
        msg = {'id': mid, 'method': method, 'params': params or {}}
        if session:
            msg['sessionId'] = session
        self.ws.send(json.dumps(msg))
        end = time.time() + timeout
        while True:
            left = end - time.time()
            if left <= 0:
                raise TimeoutError(method)
            try:
                raw = self.ws.recv(timeout=left)
            except TimeoutError:
                raise TimeoutError(method)
            m = json.loads(raw)
            if m.get('id') == mid:
                if 'error' in m:
                    raise RuntimeError('%s: %s' % (method, m['error']))
                return m.get('result', {})
            if 'method' in m:
                self.events.append(m)

    def call(self, method, **params):
        """send() with the parameters as keywords: call('Page.navigate', url=...)."""
        return self.send(method, params)

    def pump(self, seconds):
        """Read for `seconds`, keeping the events that arrive."""
        end = time.time() + seconds
        while time.time() < end:
            try:
                m = json.loads(self.ws.recv(timeout=max(0.01, end - time.time())))
            except TimeoutError:
                break
            if 'method' in m:
                self.events.append(m)

    def js(self, expr, timeout=120):
        """Evaluate in the page (awaiting a promise) and return the value."""
        r = self.send('Runtime.evaluate', {'expression': expr, 'awaitPromise': True, 'returnByValue': True}, timeout)
        if 'exceptionDetails' in r:
            raise RuntimeError('js: ' + json.dumps(r['exceptionDetails'])[:600])
        return r.get('result', {}).get('value')

    def wait(self, expr, timeout=20, step=0.15):
        """Poll `expr` until it is truthy; TimeoutError after `timeout` seconds."""
        end = time.time() + timeout
        while time.time() < end:
            v = self.js(expr)
            if v:
                return v
            self.pump(step)
        raise TimeoutError('wait: ' + expr[:120])

    def visibility(self):
        """{'hidden': bool, 'state': 'visible' | 'hidden'} of the current page."""
        return self.js('({ hidden: document.hidden, state: document.visibilityState })')

    def assert_visible(self):
        """Raise HiddenPage when the page is hidden; return the visibility otherwise."""
        v = self.visibility()
        if v.get('hidden') or v.get('state') != 'visible':
            raise HiddenPage('document.hidden is %s (%s): keep the display awake and run again' % (v.get('hidden'), v.get('state')))
        return v

    def close(self):
        if self.ws is not None:
            try:
                self.send('Browser.close', timeout=5)
            except Exception:
                pass
            try:
                self.ws.sock.close()
            except OSError:
                pass
            self.ws = None
        if self.proc.poll() is None:
            self.proc.terminate()
            try:
                self.proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                self.proc.kill()
        try:
            self.log.close()
        except OSError:
            pass
        if self.own_profile:
            shutil.rmtree(self.profile, ignore_errors=True)
            try:
                os.remove(self.log_path)
            except OSError:
                pass
