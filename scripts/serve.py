#!/usr/bin/env python3
"""Local dev server for Mekong. Serves the project root with no-cache headers so
edits show up immediately. Mirrors the Gardenoosh serve.py.

Usage: python3 scripts/serve.py [port]   (default 8742)
"""
import http.server
import os
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8742
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def guess_type(self, path):
        if path.endswith(".webmanifest"):
            return "application/manifest+json"
        if path.endswith(".js") or path.endswith(".mjs"):
            return "text/javascript"
        if path.endswith(".svg"):
            return "image/svg+xml"
        return super().guess_type(path)


class Server(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    os.chdir(ROOT)
    with Server(("127.0.0.1", PORT), Handler) as httpd:
        print(f"Mekong dev server: http://127.0.0.1:{PORT}/  (root: {ROOT})")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nstopped")
