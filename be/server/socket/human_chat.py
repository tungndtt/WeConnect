from be.server.context import user_socket_connections, group_members, dao


async def handle_room_chat(request) -> str:
    sender_id = request["user_id"]
    message = request["message"]
    receiver_id = request["other_user_id"]
    chat_room_id = None
    if "chat_room_id" not in request:
        #TODO: Check the insert status
        chat_room_id = dao.register_new_chat_room(sender_id, receiver_id)
    else:
        chat_room_id = request["chat_room_id"]
    #TODO: Check the insert status
    message_timestamp = dao.register_new_message_in_room(
        sender_id, receiver_id, chat_room_id, message
    )
    sender_socket_connection = user_socket_connections[sender_id]
    room_message = {
        "chat_type": "room",
        "user_id": sender_id,
        "chat_room_id": chat_room_id, 
        "message": message, 
        "timestamp": message_timestamp
    }
    await sender_socket_connection.send_json(room_message)
    if receiver_id in user_socket_connections:
        receiver_socket_connection = user_socket_connections[receiver_id]
        await receiver_socket_connection.send_json(room_message)


async def handle_group_chat(request) -> str:
    user_id = request["user_id"]
    message = request["message"]
    chat_group_id = request["chat_group_id"]
    message_timestamp = dao.register_new_message_in_group(
        user_id, chat_group_id, message
    )
    group_message = {
        "chat_type": "group",
        "user_id": user_id, 
        "chat_group_id": chat_group_id, 
        "message": message, 
        "timestamp": message_timestamp
    }
    for member_id in group_members[chat_group_id]:
        member_socket_connection = user_socket_connections[member_id]
        await member_socket_connection.send_json(group_message)