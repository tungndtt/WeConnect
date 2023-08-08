from be.server.http.misc import verify_request, generate_json_response
from be.server.context import dao


@verify_request
async def handle_get_notifications(request):
    notifications = dao().get_notifications(request.user_id)
    return generate_json_response(True, notifications)


@verify_request
async def handle_update_notification(request):
    request_body = await request.json()
    if "chat_room_id" not in request_body:
        return generate_json_response(True, "Cannot update notification without room id specified")
    chat_room_id = request_body["chat_room_id"]
    status = dao().update_read_notification(request.user_id, chat_room_id)
    return generate_json_response(status, None)