from be.server.http.misc import verify_request, generate_json_response
from be.server.context import dao, get_group_members


@verify_request
async def handle_get_all_users(_):
    users = dao().get_all_users()
    return generate_json_response(True, users)


@verify_request
async def handle_get_users_in_group(request):
    chat_group_id = request.match_info.get("group-id", "")
    if not chat_group_id:
        return generate_json_response(False, "Cannot get group without group id specified")
    members = get_group_members(chat_group_id)
    members_information = dao().get_users_information(members, False)
    return generate_json_response(True, members_information)


@verify_request
async def handle_get_user_profile(request):
    user_information = dao().get_users_information([request.user_id], True)[0]
    return generate_json_response(True, user_information)


@verify_request
async def handle_update_user(request):
    request_body = await request.json()
    args = []
    for field in ["first_name", "last_name", "password"]:
        if field in request_body:
            args.append(request_body[field])
        else:
            args.append(None)
    status = dao().update_user_information(*args)
    return generate_json_response(status, None)