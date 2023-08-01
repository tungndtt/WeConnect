from datetime import datetime
from be.server.context import dao, group_members, user_socket_connections
from be.server.http.misc import verify_request, generate_json_response


@verify_request
async def handle_get_chat_groups(_):
    chat_rooms = dao.get_chat_groups()
    return generate_json_response(True, chat_rooms)


@verify_request
async def handle_get_chat_group(request):
    request_body = await request.json()
    chat_group_id = request.match_info.get("group-id", "")
    if not chat_group_id:
        return generate_json_response(False, "Chat group is not given")
    if "until" not in request_body:
        until = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    else:
        until = request_body["until"]
    group_chat_messages = dao.get_human_chat_messages(False, chat_group_id, until, 100)
    return generate_json_response(True, group_chat_messages)


@verify_request
async def handle_access_chat_group(request):
    request_body = await request.json()
    chat_group_id = request.match_info.get("group-id", "")
    if not chat_group_id or "is_enter" not in request_body:
        return generate_json_response(False, "Chat group and entering/leaving action must be given")
    user_id = request.user_id
    user_first_name, user_last_name = dao.get_users_information([user_id], False)[0]
    is_enter = request_body["is_enter"]
    members = group_members[chat_group_id]
    if is_enter and user_id not in members:
        for member_id in members:
            member_socket_connection = user_socket_connections[member_id]
            member_socket_connection.send_json(
                {"message": f"{user_first_name} {user_last_name} just joined the group"}
            )
        members.append(user_id)
    elif not is_enter and user_id in member_id:
        members.remove(user_id)
        for member_id in members:
            member_socket_connection = user_socket_connections[member_id]
            member_socket_connection.send_json(
                {"message": f"{user_first_name} {user_last_name} just leaved the group"}
            )
    return generate_json_response(True, None)


@verify_request
async def handle_register_chat_group(request):
    request_body = await request.json()
    if "name" not in request_body:
        return generate_json_response(False, "Cannot create chat group without name")
    status = dao.register_new_chat_group(request_body["name"], request.user_id)
    return generate_json_response(status, None)


@verify_request
async def handle_update_chat_group_name(request):
    request_body = await request.json()
    if "name" not in request_body or "group_id" not in request_body:
        return generate_json_response(
            False, "Cannot update chat group name without specified fields 'group_id' or 'name'"
        )
    status = dao.update_chat_group_name(request_body["group_id"], request_body["name"])
    return generate_json_response(status, None)