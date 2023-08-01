from aiohttp import web
import asyncio
from be.jwt.jwt import verify_token
from be.server.context import register_connection, deregister_connection
from be.server.socket.bot_chat import handle_bot_chat
from be.server.socket.human_chat import handle_room_chat, handle_group_chat


def _verify_request(request) -> None:
    token = request["token"]
    is_valid, payload = verify_token(token)
    if not is_valid:
        raise Exception("Invalid expired token")
    request["user_id"] = payload["user_id"]


async def handle_socket(socket_request):
    user_socket_connection = web.WebSocketResponse()
    await user_socket_connection.prepare(socket_request)
    user_id = None
    try:
        # Init the socket connection corresponding to given user_id
        request = await user_socket_connection.receive_json()
        _verify_request(request)
        user_id = request["user_id"]
        register_connection(user_id, user_socket_connection)
        while True:
            request = await user_socket_connection.receive_json()
            _verify_request(request)
            chat_type = request["chat_type"]
            if chat_type == "bot":
                await handle_bot_chat(request)
            elif chat_type == "room":
                await handle_room_chat(request)
            elif chat_type == "group":
                await handle_group_chat(request)
    except asyncio.CancelledError:
        print("[Socket] Client disconnected")
    await user_socket_connection.close()
    if user_id is not None:
        deregister_connection(user_id)
    return user_socket_connection


socket_routes = [
    web.get("/socket", handle_socket)
]