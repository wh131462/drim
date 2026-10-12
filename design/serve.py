"""Run: python3 design/serve.py [port]."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import sys


class PreviewHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4175
    handler = partial(PreviewHandler, directory=str(Path(__file__).parent))
    print(f'Design preview: http://127.0.0.1:{port}/index.html', flush=True)
    ThreadingHTTPServer(('127.0.0.1', port), handler).serve_forever()
