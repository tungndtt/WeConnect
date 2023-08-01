from aiohttp.web import WebSocketResponse
from be.database.database import Database


dao = Database()
user_socket_connections: dict[int, WebSocketResponse] = {}
botchat_messages: dict[int, list[str]] = {}
group_members: dict[int, list[int]] = {
    chat_group_id: [] 
    for chat_group_id in dao.get_chat_groups()
}


def register_connection(user_id: int, user_socket_connection: WebSocketResponse) -> None:
    user_socket_connections[user_id] = user_socket_connection
    botchat_messages[user_id] = []


def deregister_connection(user_id: int) -> None:
    if user_id in user_socket_connections:
        del user_socket_connections[user_id]
    if user_id in botchat_messages:
        del botchat_messages[user_id]

