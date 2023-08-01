from aiohttp import web
from be.jwt.jwt import verify_token
from be.server.context import deregister_connection


async def verify_request(handler):
    async def verify(request):
        token = request.headers.get("Authorization", "")
        if not token:
            return web.json_response({"status": False, "data": "Invalid access token"})
        is_valid, payload = verify_token(token)
        if payload is None or "user_id" not in payload:
            return web.json_response({"status": False, "data": "Invalid access token"})
        user_id = payload["user_id"]
        if not is_valid:
            deregister_connection(user_id)
            return web.json_response({"status": False, "data": "Expired access token"})
        request.user_id = user_id
        return handler(request)
    return verify


def generate_json_response(status, response):
    return web.json_response({"status": status, "data": response})