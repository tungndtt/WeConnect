from be.server.context import dao, unicast_user, multicast_chat_group


async def handle_room_chat(request) -> None:
    sender_id = request["user_id"]
    message = request["message"]
    receiver_id = request["other_user_id"]
    chat_room_id = None
    if "chat_room_id" not in request:
        #TODO: Check the insert status
        chat_room_id = dao().register_new_chat_room(sender_id, receiver_id)
    else:
        chat_room_id = request["chat_room_id"]
    #TODO: Check the insert status
    message_timestamp = dao().register_new_message_in_room(
        sender_id, receiver_id, chat_room_id, message
    )
    room_message = {
        "type": "room_chat_message",
        "user_id": sender_id,
        "chat_room_id": chat_room_id, 
        "message": message, 
        "timestamp": message_timestamp
    }
    await unicast_user(sender_id, room_message)
    await unicast_user(receiver_id, room_message)


async def handle_group_chat(request) -> None:
    user_id = request["user_id"]
    message = request["message"]
    chat_group_id = request["chat_group_id"]
    message_timestamp = dao().register_new_message_in_group(
        user_id, chat_group_id, message
    )
    group_message = {
        "type": "group_chat_message",
        "user_id": user_id, 
        "chat_group_id": chat_group_id, 
        "message": message, 
        "timestamp": message_timestamp
    }
    await multicast_chat_group(chat_group_id, group_message)
    