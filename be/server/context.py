from aiohttp.web import WebSocketResponse
from be.database.database import Database
from be.jwt.jwt import Jwt


__dao = Database()
__jwt = Jwt()
__user_socket_connections: dict[int, WebSocketResponse] = {}
__botchat_messages: dict[int, list[str]] = {}
__group_members: dict[int, list[int]] = {
    chat_group_id: [] 
    for chat_group_id in __dao.get_chat_groups()
}


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


async def multicast_chat_group(chat_group_id: int, message) -> None:
    for member_id in __group_members[chat_group_id]:
        member_socket_connection = __user_socket_connections[member_id]
        await member_socket_connection.send_json(message)


async def broadcast_all_users(message) -> None:
    for user_socket_connection in __user_socket_connections.values():
        await user_socket_connection.send_json(message)


def get_botchat_messages(user_id: int) -> list[str]:
    return __botchat_messages[user_id]


def get_group_members(chat_group_id: int) -> list[int]:
    return __group_members[chat_group_id]
