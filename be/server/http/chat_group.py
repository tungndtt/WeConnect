from be.server.context import dao, get_group_members, multicast_chat_group, broadcast_all_users
from be.server.http.misc import verify_request, generate_json_response, extract_timestamp_args


@verify_request
async def handle_get_chat_groups(_):
    chat_rooms = dao().get_chat_groups()
    return generate_json_response(True, chat_rooms)


@verify_request
async def handle_get_chat_group(request):
    request_body = await request.json()
    chat_group_id = request.match_info.get("group-id", "")
    if not chat_group_id:
        return generate_json_response(False, "Chat group is not given")
    timestamp, before = extract_timestamp_args(request_body)
    group_chat_messages = dao().get_human_chat_messages(False, chat_group_id, timestamp, before, 100)
    return generate_json_response(True, group_chat_messages)


@verify_request
async def handle_access_chat_group(request):
    request_body = await request.json()
    chat_group_id = request.match_info.get("group-id", "")
    if not chat_group_id or "is_enter" not in request_body:
        return generate_json_response(False, "Chat group and entering/leaving action must be given")
    user_id = request.user_id
    user_first_name, user_last_name = dao().get_users_information([user_id], False)[0]
    is_enter = request_body["is_enter"]
    members = get_group_members(chat_group_id)
    if is_enter and user_id not in members:
        members.append(user_id)
        message = {
            "type": "group_chat_activity",
            "message": f"{user_first_name} {user_last_name} just joined the group",
        }
        await multicast_chat_group(chat_group_id, message)
    elif not is_enter and user_id in members:
        members.remove(user_id)
        message = {
            "type": "group_chat_activity",
            "message": f"{user_first_name} {user_last_name} just leaved the group",
        }
        multicast_chat_group(chat_group_id, message)
    return generate_json_response(True, None)


@verify_request
async def handle_register_chat_group(request):
    request_body = await request.json()
    if "name" not in request_body:
        return generate_json_response(False, "Cannot create chat group without name")
    group_name = request_body["name"]
    owner_id = request.user_id
    chat_group_id = dao().register_new_chat_group(group_name, owner_id)
    if chat_group_id is None:
        return generate_json_response(False, None)
    else:
        await broadcast_all_users({
            "type": "group_chat_update", "chat_group_id": chat_group_id,
            "name": group_name, "owner_id": owner_id
        })
        return generate_json_response(True, None)


@verify_request
async def handle_update_chat_group_name(request):
    request_body = await request.json()
    if "name" not in request_body or "group_id" not in request_body:
        return generate_json_response(
            False, "Cannot update chat group name without specified fields 'group_id' or 'name'"
        )
    chat_group_id = request_body["group_id"]
    group_name = request_body["name"]
    status = dao().update_chat_group_name(chat_group_id, group_name)
    if status:
        await broadcast_all_users({
            "type": "group_chat_update", "chat_group_id": chat_group_id,
            "name": group_name, "owner_id": request.user_id
        })
    return generate_json_response(status, None)