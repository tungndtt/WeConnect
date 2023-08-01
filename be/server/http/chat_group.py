from datetime import datetime
from be.server.context import dao
from be.server.http.misc import verify_request, generate_json_response


@verify_request
async def handle_get_chat_groups(request):
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