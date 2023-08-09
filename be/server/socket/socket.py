from aiohttp import web
import asyncio
from be.server.context import register_connection, deregister_connection
from be.server.socket.misc import verify_request
from be.server.socket.bot_chat import handle_bot_chat
from be.server.socket.human_chat import handle_room_chat, handle_group_chat


async def handle_socket(socket_request):
    user_socket_connection = web.WebSocketResponse()
    await user_socket_connection.prepare(socket_request)
    user_id = None
    try:
        # Init the socket connection corresponding to given user_id
        request = await user_socket_connection.receive_json()
        verify_request(request)
        user_id = request["user_id"]
        register_connection(user_id, user_socket_connection)
        while True:
            request = await user_socket_connection.receive_json()
            verify_request(request)
            chat_type = request["chat_type"]
            if chat_type == "bot":
                await handle_bot_chat(request)
            elif chat_type == "room":
                await handle_room_chat(request)
            elif chat_type == "group":
                await handle_group_chat(request)
    except asyncio.CancelledError:
        print("[Socket] Server run cancelled")
    except Exception:
        print("[Socket] Client disconnected")
    await user_socket_connection.close()
    if user_id is not None:
        deregister_connection(user_id)
    return user_socket_connection


socket_routes = [
    web.get("/socket", handle_socket)
]