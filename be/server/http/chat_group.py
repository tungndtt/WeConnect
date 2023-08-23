from be.server.context import dao, unicast_user, broadcast_all_users
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
async def handle_get_group_access_requests(request):
    chat_group_id = request.match_info.get("group-id", "")
    if not chat_group_id:
        return generate_json_response(False, "Chat group must be specified")
    access_requests = dao().get_group_access_requests(chat_group_id)
    return generate_json_response(True, access_requests)


@verify_request
async def handle_register_access_request(request):
    chat_group_id = request.match_info.get("group-id", "")
    if not chat_group_id:
        return generate_json_response(False, "Chat group must be specified")
    requester_id = request.user_id
    current_timestamp = dao().register_new_access_request(requester_id, chat_group_id)
    return generate_json_response(current_timestamp is not None, current_timestamp)


@verify_request
async def handle_review_access_request(request):
    request_body = await request.json()
    chat_group_id = request.match_info.get("group-id", "")
    if not chat_group_id or "requester_id" not in request_body or "access" not in request_body:
        return generate_json_response(False, "Chat group id, 'requester_id' and 'access' must be specified")
    reviewer_id = request.user_id
    requester_id = request_body["requester_id"]
    access = request_body["access"]
    current_timestamp = dao().update_access_request(reviewer_id, requester_id, chat_group_id, access)
    if current_timestamp is not None:
        await unicast_user(
            requester_id,
            {
                "type": "group_chat_message",
                "user_id": reviewer_id,
                "chat_group_id": chat_group_id, 
                "message": None,
                "epoch": None,
                "timestamp": current_timestamp,
            }
        )
    return generate_json_response(current_timestamp is not None, None)


@verify_request
async def handle_register_chat_group(request):
    request_body = await request.json()
    if "name" not in request_body:
        return generate_json_response(False, "Cannot create chat group without specified field 'name'")
    group_name = request_body["name"]
    owner_id = request.user_id
    chat_group_id = dao().register_new_chat_group(group_name, owner_id)
    if chat_group_id is None:
        return generate_json_response(False, None)
    else:
        await broadcast_all_users({
            "type": "group_chat_update", 
            "chat_group_id": chat_group_id,
            "name": group_name, 
            "owner_id": owner_id
        })
        return generate_json_response(True, None)


@verify_request
async def handle_update_chat_group(request):
    request_body = await request.json()
    chat_group_id = request.match_info.get("group-id", "")
    if not chat_group_id or "name" not in request_body or "owner_id" not in request_body:
        return generate_json_response(
            False, "Cannot update chat group without specified chat group id, fields 'name' and 'owner_id'"
        )
    chat_group_id = request_body["group_id"]
    group_name = request_body["name"]
    owner_id = request_body["owner_id"]
    status = dao().update_chat_group(chat_group_id, group_name, owner_id)
    if status:
        await broadcast_all_users({
            "type": "group_chat_update", 
            "chat_group_id": chat_group_id,
            "name": group_name, 
            "owner_id": owner_id
        })
    return generate_json_response(status, None)

@verify_request
async def handle_unregister_access_request(request):
    request_body = await request.json()
    chat_group_id = request.match_info.get("group-id", "")
    if not chat_group_id or "user_id" not in request_body:
        return generate_json_response(
            False, "Cannot unregister access request without specified chat group id or field 'user_id'"
        )
    user_id = request.user_id
    removed_user_id = request_body["user_id"]
    if user_id == removed_user_id or dao().is_chat_group_owner(user_id, chat_group_id):
        is_leave = dao().unregister_access_request(user_id, chat_group_id)
        if is_leave is None:
            status = False
        else:
            status = True
            await unicast_user(
                removed_user_id,
                {
                    "type": "unregister_access_request",
                    "chat_group_id": chat_group_id,
                    "is_leave": is_leave
                }
            )
    else:
        status = False
    return generate_json_response(status, None)
