#!/usr/bin/env python3
"""Lokale dev-server voor Burger 'n Shake met caching UIT.
Start:  python3 serve.py   ->   http://localhost:8000
Elke reload haalt verse bestanden op (geen browser-cache meer)."""
import functools
import http.server
import socketserver

PORT = 8000
ROOT = "/Users/ricky/Burger n Shake"


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


socketserver.TCPServer.allow_reuse_address = True
handler = functools.partial(NoCacheHandler, directory=ROOT)
with socketserver.TCPServer(("", PORT), handler) as httpd:
    print(f"Burger 'n Shake draait op http://localhost:{PORT}/over-ons.html")
    httpd.serve_forever()
