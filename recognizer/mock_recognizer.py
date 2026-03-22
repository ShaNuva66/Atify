from http.server import BaseHTTPRequestHandler, HTTPServer
import json


class Handler(BaseHTTPRequestHandler):
    def _json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            self._json({"status": "ok"})
            return
        self._json({"status": "not_found"}, status=404)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        if length > 0:
            self.rfile.read(length)

        if self.path == "/recognize-simple":
            # Mock: no match
            self._json({"match": False, "songCode": None})
            return

        if self.path == "/fingerprint-file":
            self._json({"status": "accepted"})
            return

        self._json({"status": "not_found"}, status=404)


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", 5001), Handler)
    print("Mock recognizer listening on :5001")
    server.serve_forever()
