from aiohttp import web
from datetime import datetime
from be.server.context import jwt, deregister_connection


async def verify_request(handler):
    async def verify(request):
        token = request.headers.get("Authorization", "")
        if not token:
            return web.json_response({"status": False, "data": "Invalid access token"})
        is_valid, payload = jwt().verify_token(token)
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
    return web.json_response(data={"data": response}, status=200 if status else 400)


def extract_timestamp_args(request_body):
    if "timestamp" not in request_body:
        timestamp = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        before = True
    else:
        timestamp = request_body["timestamp"]
        before = request_body["before"] if "before" in request_body else False
    return timestamp, before