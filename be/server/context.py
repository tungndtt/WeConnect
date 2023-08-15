from aiohttp.web import WebSocketResponse
from be.database.database import Database
from be.jwt.jwt import Jwt


__dao = Database()
__jwt = Jwt()
__user_socket_connections: dict[int, WebSocketResponse] = {}
__botchat_messages: dict[int, list[str]] = {}


def dao() -> Database:
    return __dao


def jwt() -> Jwt:
    return __jwt


def register_connection(user_id: int, user_socket_connection: WebSocketResponse) -> None:
    __user_socket_connections[user_id] = user_socket_connection
    __botchat_messages[user_id] = []


def deregister_connection(user_id: int) -> None:
    if user_id in __user_socket_connections:
        del __user_socket_connections[user_id]
    if user_id in __botchat_messages:
        del __botchat_messages[user_id]


async def unicast_user(user_id: int, message) -> None:
    if user_id in __user_socket_connections:
        user_socket_connection = __user_socket_connections[user_id]
        await user_socket_connection.send_json(message)


async def broadcast_all_users(message) -> None:
    for user_socket_connection in __user_socket_connections.values():
        await user_socket_connection.send_json(message)


def get_botchat_messages(user_id: int) -> list[str]:
    return __botchat_messages[user_id]


def get_all_online_user_ids() -> list[int]:
    return list(__user_socket_connections.keys())

