from be.server.context import dao, jwt, deregister_connection, broadcast_all_users
from be.server.http.misc import generate_json_response


async def handle_login(request):
    try:
        payload = await request.json()
        email = payload["email"] if "email" in payload else ""
        password = payload["password"] if "password" in payload else ""
        user_id = dao().get_user(email, password)
        if user_id == -1:
            return generate_json_response(False, "Invalid authentication")
        token = jwt().generate_token({"user_id": user_id}, 120)
        await broadcast_all_users({
            "type": "user_activity", 
            "user_id": user_id,
            "action": 0,
        })
        return generate_json_response(True, token)
    except Exception as error:
        print("[Login] Cannot parse the payload " + error)
        return generate_json_response(False, "Cannot parse the payload")


async def handle_logout(request):
    token = request.headers.get("Authorization", "")
    _, payload = jwt().verify_token(token)
    if payload is not None:
        user_id = payload["user_id"]
        deregister_connection(user_id)
        await broadcast_all_users({
            "type": "user_activity", 
            "user_id": user_id,
            "action": 1,
        })
    return generate_json_response(True, None)