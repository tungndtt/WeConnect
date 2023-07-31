import websockets
import json
from be.jwt.jwt import verify_token
from be.server.context import host, socket_port, register_connection, deregister_connection
from be.server.socket.bot_chat import handle_bot_chat
from be.server.socket.human_chat import handle_room_chat, handle_group_chat


async def _handle(socket_connection) -> None:
    try:
        socket_connection.user_id = ""
        while True:
            request = await socket_connection.recv()
            parsed_request = json.loads(request)
            token = parsed_request["token"]
            parsed_token = verify_token(token)
            if parsed_token is None:
                raise Exception("Invalid expired token")
            user_id = parsed_token["user_id"]
            if not socket_connection.user_id:
                socket_connection.user_id = user_id
                register_connection(socket_connection)
            chat_type = parsed_request["chat_type"]
            if chat_type == "bot":
                handle_bot_chat(parsed_request)
            elif chat_type == "room":
                handle_room_chat(parsed_request)
            elif chat_type == "group":
                handle_group_chat(parsed_request)
    except Exception:
        print("[Socket] Client disconnected")
        if not socket_connection.user_id:
            deregister_connection(socket_connection)


async def run() -> None:
    print("[Socket]: Start running Socket handler")
    websockets.serve(_handle, host, int(socket_port))