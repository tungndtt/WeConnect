from be.server.http.misc import verify_request, generate_json_response
from be.server.context import dao, get_all_online_user_ids, broadcast_all_users


@verify_request
async def handle_get_all_users(_):
    users = dao().get_all_users()
    online_user_ids = get_all_online_user_ids()
    return generate_json_response(True, {"users": users, "online_user_ids": online_user_ids})


@verify_request
async def handle_get_user_profile(request):
    user_profile = dao().get_user_profile(request.user_id)
    return generate_json_response(True, user_profile)


@verify_request
async def handle_update_user(request):
    request_body = await request.json()
    args = []
    for field in ["user_id", "first_name", "last_name", "password"]:
        if field in request_body:
            args.append(request_body[field])
        else:
            args.append(None)
    status = dao().update_user_profile(*args)
    if status:
        await broadcast_all_users({
            "type": "user_update", "user_id": args[0],
            "first_name": args[1], "last_name": args[2]
        })
    return generate_json_response(status, None)


@verify_request
async def handle_get_access_requests(request):
    access_requests = dao().get_user_access_requests(request.user_id)
    return generate_json_response(True, access_requests)