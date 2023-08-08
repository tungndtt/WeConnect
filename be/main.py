from aiohttp import web
import os
from be.server.http.http import http_routes
from be.server.socket.socket import socket_routes


def __start() -> None:
    host = os.environ.get("HOST", "127.0.0.1")
    port = os.environ.get("HTTP_PORT", 2204)
    app = web.Application()
    app.add_routes(http_routes + socket_routes)
    web.run_app(app, host=host, port=port)


if __name__ == "__main__":
    __start()