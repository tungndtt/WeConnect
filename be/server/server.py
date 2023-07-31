import asyncio
from be.server.http.http import run as run_http_handler
from be.server.socket.socket import run as run_socket_handler


def start() -> None:
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(run_http_handler())
        loop.run_until_complete(run_socket_handler())
        loop.run_forever()
    finally:
        loop.close()