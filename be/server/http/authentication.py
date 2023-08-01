import os
from be.jwt.jwt import generate_token, verify_token
from be.server.context import dao, deregister_connection
from be.server.http.misc import generate_json_response


async def handle_login(request):
    try:
        payload = await request.json()
        email = payload["email"] if "email" in payload else ""
        password = payload["password"] if "password" in payload else ""
        user_id = dao.get_user(email, password)
        if user_id == -1:
            return generate_json_response(False, "Invalid authentication")
        token = generate_token({"user_id": user_id}, 120)
        return generate_json_response(True, token)
    except Exception as error:
        print("[Login] Cannot parse the payload " + error)
        return generate_json_response(False, "Cannot parse the payload")


async def handle_logout(request):
    token = request.headers.get("Authorization", "")
    _, payload = verify_token(token)
    if payload is not None:
        deregister_connection(payload["user_id"])
    return generate_json_response(True, None)