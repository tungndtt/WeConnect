import os
from typing import Any
from be.database.database import Database


host = os.environ.get("HOST", "127.0.0.1")
http_port = os.environ.get("HTTP_PORT", 2204)
socket_port = os.environ.get("SOCKET_PORT", 1998)
database = Database()
socket_connections: dict[int, Any] = {}
botchat_messages: dict[int, list[str]] = {}
chat_groups: dict[int, list[int]] = {chat_group_id: [] for chat_group_id in database.get_chat_groups()}


def register_connection(socket_connection: Any) -> None:
    socket_connections[socket_connection.user_id] = socket_connection
    botchat_messages[socket_connection.user_id] = []


def deregister_connection(socket_connection: Any) -> None:
    del socket_connections[socket_connection.user_id]
    del botchat_messages[socket_connection.user_id]

