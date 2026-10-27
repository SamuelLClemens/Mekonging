"""Minimal stdlib Chrome DevTools Protocol client (no websocket package on this machine).

Copied from the F3 driver for the style digest (S1). Q2 (docs/PROGRAM.md 4.6) commits one shared client under
tools/cdp/; this copy folds into it then."""
import base64
import json
import os
import socket
import struct
import subprocess
import time
import urllib.request

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'


class WS:
    def __init__(self, url):
        assert url.startswith('ws://')
        hostport, path = url[5:].split('/', 1)
        host, port = hostport.split(':')
        self.sock = socket.create_connection((host, int(port)))
        key = base64.b64encode(os.urandom(16)).decode()
        req = ('GET /%s HTTP/1.1\r\nHost: %s\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n'
               'Sec-WebSocket-Key: %s\r\nSec-WebSocket-Version: 13\r\n\r\n') % (path, hostport, key)
        self.sock.sendall(req.encode())
        buf = b''
        while b'\r\n\r\n' not in buf:
            buf += self.sock.recv(4096)
        head, self.rest = buf.split(b'\r\n\r\n', 1)
        assert b' 101 ' in head.split(b'\r\n')[0], head

    def send(self, text):
        data = text.encode()
        hdr = bytearray([0x81])
        n = len(data)
        if n < 126:
            hdr.append(0x80 | n)
        elif n < 65536:
            hdr.append(0x80 | 126); hdr += struct.pack('>H', n)
        else:
            hdr.append(0x80 | 127); hdr += struct.pack('>Q', n)
        mask = os.urandom(4)
        hdr += mask
        self.sock.sendall(bytes(hdr) + bytes(b ^ mask[i % 4] for i, b in enumerate(data)))

    def _read(self, n):
        while len(self.rest) < n:
            chunk = self.sock.recv(1 << 20)
            if not chunk:
                raise ConnectionError('socket closed')
            self.rest += chunk
        out, self.rest = self.rest[:n], self.rest[n:]
        return out

    def recv(self, timeout=None):
        self.sock.settimeout(timeout)
        msg = b''
        while True:
            b1, b2 = self._read(2)
            fin, op = b1 & 0x80, b1 & 0x0F
            n = b2 & 0x7F
            if n == 126:
                n = struct.unpack('>H', self._read(2))[0]
            elif n == 127:
                n = struct.unpack('>Q', self._read(8))[0]
            payload = self._read(n)
            if op == 8:
                raise ConnectionError('closed')
            if op in (0, 1, 2):
                msg += payload
                if fin:
                    return msg.decode('utf-8', 'replace')


class Chrome:
    def __init__(self, profile_dir, port, extra_args=()):
        self.port = port
        self.proc = subprocess.Popen([
            CHROME, '--headless=new', '--remote-debugging-port=%d' % port, '--user-data-dir=' + profile_dir,
            '--no-first-run', '--no-default-browser-check', '--no-proxy-server', '--no-sandbox', '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', *extra_args, 'about:blank'],
            stdout=subprocess.DEVNULL, stderr=open(profile_dir + '.log', 'w'))
        for _ in range(900):
            try:
                tabs = json.load(urllib.request.urlopen('http://127.0.0.1:%d/json/list' % port, timeout=1))
                page = [t for t in tabs if t['type'] == 'page'][0]
                break
            except Exception:
                time.sleep(0.1)
        self.ws = WS(page['webSocketDebuggerUrl'])
        self.seq = 0
        self.events = []

    def send(self, method, params=None, timeout=120):
        self.seq += 1
        mid = self.seq
        self.ws.send(json.dumps({'id': mid, 'method': method, 'params': params or {}}))
        end = time.time() + timeout
        while True:
            left = end - time.time()
            if left <= 0:
                raise TimeoutError(method)
            msg = json.loads(self.ws.recv(timeout=left))
            if msg.get('id') == mid:
                if 'error' in msg:
                    raise RuntimeError('%s: %s' % (method, msg['error']))
                return msg.get('result', {})
            if 'method' in msg:
                self.events.append(msg)

    def pump(self, seconds):
        end = time.time() + seconds
        while time.time() < end:
            try:
                msg = json.loads(self.ws.recv(timeout=max(0.01, end - time.time())))
                if 'method' in msg:
                    self.events.append(msg)
            except (socket.timeout, TimeoutError):
                break

    def js(self, expr, timeout=120):
        r = self.send('Runtime.evaluate', {'expression': expr, 'awaitPromise': True, 'returnByValue': True}, timeout)
        if 'exceptionDetails' in r:
            raise RuntimeError('js: ' + json.dumps(r['exceptionDetails'])[:600])
        return r.get('result', {}).get('value')

    def wait(self, expr, timeout=20, step=0.15):
        end = time.time() + timeout
        while time.time() < end:
            v = self.js(expr)
            if v:
                return v
            self.pump(step)
        raise TimeoutError('wait: ' + expr[:120])

    def close(self):
        try:
            self.send('Browser.close', timeout=5)
        except Exception:
            pass
        self.proc.terminate()
