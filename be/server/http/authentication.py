from aiohttp import web
import os
from be.jwt.jwt import generate_token, verify_token
from be.server.context import dao, deregister_connection


_duration = os.environ.get("SESSION_DURATION", 120)


async def handle_login(request):
    try:
        payload = await request.json()
        email = payload["email"] if "email" in payload else ""
        password = payload["password"] if "password" in payload else ""
        user_id = dao.get_user(email, password)
        if user_id == -1:
            return web.json_response({"status": False, "data": "Invalid authentication"})
        token = generate_token({"user_id": user_id}, _duration)
        return web.json_response({"status": True, "data": token})
    except Exception as error:
        print("[Login] Cannot parse the payload " + error)
        return web.json_response({"status": False, "data": "Cannot parse the payload"})


async def handle_logout(request):
    token = request.headers.get("Authorization", "")
    _, payload = verify_token(token)
    if payload is not None:
        deregister_connection(payload["user_id"])
    return web.json_response({"status": True})