from be.server.http.misc import verify_request, generate_json_response
from be.server.context import dao


@verify_request
async def handle_get_chat_notifications(request):
    chat_notifications = dao().get_chat_notifications(request.user_id)
    return generate_json_response(True, chat_notifications)


@verify_request
async def handle_update_chat_notification(request):
    request_body = await request.json()
    if "chat_id" not in request_body or "is_room" not in request_body:
        return generate_json_response(True, "Cannot update notification without 'chat_id' and 'is_room'")
    chat_id = request_body["chat_id"]
    is_room = request_body["is_room"]
    status = dao().update_chat_notification(request.user_id, chat_id, is_room)
    return generate_json_response(status, None)