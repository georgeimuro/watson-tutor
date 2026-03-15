import http.server
import functools

class UTF8Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Content-Type', self.guess_type(self.path) + '; charset=utf-8')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.js'): return 'text/javascript'
        if path.endswith('.html'): return 'text/html'
        if path.endswith('.css'): return 'text/css'
        return super().guess_type(path)

http.server.HTTPServer(('', 8787), UTF8Handler).serve_forever()
