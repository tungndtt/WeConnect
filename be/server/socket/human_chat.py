from typing import Any
from be.server.context import socket_connections, chat_groups, database


def handle_room_chat(request: Any) -> str:
    sender_id = request["user_id"]
    message = request["message"]
    receiver_id = request["other_user_id"]
    chat_room_id = None
    if "chat_room_id" not in request:
        #TODO: Check the insert status
        database.register_new_chat_room(sender_id, receiver_id)
    else:
        chat_room_id = request["chat_room_id"]
    #TODO: Check the insert status
    database.register_new_message_in_room(sender_id, chat_room_id, message)
    if receiver_id in socket_connections:
        receiver_connection = socket_connections[receiver_id]
        #TODO: Notify other user new message
        receiver_connection.send()
    #TODO: Check the insert status
    database.register_new_notification(sender_id, chat_room_id)


def handle_group_chat(request: Any) -> str:
    user_id = request["user_id"]
    message = request["message"]
    chat_group_id = request["chat_group_id"]
    for member_id in chat_groups[chat_group_id]:
        member_connection = socket_connections[member_id]
        #TODO: Notify member in group new message
        member_connection.send()