from http.server import BaseHTTPRequestHandler, HTTPServer
from be.server.context import host, http_port


class HttpHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(bytes("", "utf-8"))
    
    def do_POST(self) -> None:
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(bytes("", "utf-8"))


async def run():
    print("[HTTP]: Start running HTTP handler")
    webServer = HTTPServer((host, http_port), HttpHandler)
    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        pass
    webServer.server_close()
    print("[HTTP] HTTP handler stopped")